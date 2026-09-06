import { Body, Controller, Get, Injectable, Module, Param, Patch, Query, Post, UseGuards } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@nalanda/database";
import { AuditService } from "../common/audit.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import type { AuthenticatedUser } from "../common/types/authenticated-user";

@Injectable()
export class MessagesService {
  constructor(private readonly auditService: AuditService) {}

  create(dto: { name: string; phone: string; email: string; subject: string; message: string }) {
    return db.insert(schema.contactMessages).values(dto).returning();
  }

  list(status?: string) {
    if (status) return db.select().from(schema.contactMessages).where(eq(schema.contactMessages.status, status));
    return db.select().from(schema.contactMessages).orderBy(schema.contactMessages.createdAt);
  }

  async updateStatus(id: string, status: string, actorId: string) {
    const [row] = await db.update(schema.contactMessages).set({ status }).where(eq(schema.contactMessages.id, id)).returning();
    await this.auditService.log({ userId: actorId, action: "MESSAGE_STATUS_UPDATE", entity: "ContactMessage", entityId: id, description: status });
    return row;
  }
}

const createSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(6),
  email: z.string().email(),
  subject: z.string().min(1),
  message: z.string().min(1),
});
const statusSchema = z.object({ status: z.enum(["NEW", "READ", "RESPONDED"]) });

@Controller("messages")
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  // Public contact-form endpoint — intentionally unauthenticated.
  @Post()
  create(@Body(new ZodValidationPipe(createSchema)) dto: any) {
    return this.messagesService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  list(@Query("status") status?: string) {
    return this.messagesService.list(status);
  }

  @Patch(":id/status")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  updateStatus(@Param("id") id: string, @Body(new ZodValidationPipe(statusSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.messagesService.updateStatus(id, dto.status, user.sub);
  }
}

@Module({
  controllers: [MessagesController],
  providers: [MessagesService],
})
export class MessagesModule {}
