import { Body, Controller, Get, Injectable, Module, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { and, eq, type SQL } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@nalanda/database";
import { AuditService } from "../common/audit.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "../common/guards/optional-jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import type { AuthenticatedUser } from "../common/types/authenticated-user";

@Injectable()
export class FacilitiesService {
  constructor(private readonly auditService: AuditService) {}

  list(filters: { publishedOnly?: boolean } = {}) {
    const conditions: SQL[] = [];
    if (filters.publishedOnly) conditions.push(eq(schema.facilities.published, true));
    return db
      .select()
      .from(schema.facilities)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(schema.facilities.displayOrder);
  }

  async create(dto: { name: string; description?: string; imageUrl?: string; displayOrder?: number }, actorId: string) {
    const [row] = await db.insert(schema.facilities).values(dto).returning();
    await this.auditService.log({ userId: actorId, action: "FACILITY_CREATE", entity: "Facility", entityId: row.id });
    return row;
  }

  async update(id: string, dto: Partial<{ name: string; description: string; imageUrl: string; displayOrder: number; published: boolean }>, actorId: string) {
    const [row] = await db.update(schema.facilities).set({ ...dto, updatedAt: new Date().toISOString() }).where(eq(schema.facilities.id, id)).returning();
    await this.auditService.log({ userId: actorId, action: "FACILITY_UPDATE", entity: "Facility", entityId: id });
    return row;
  }
}

const createSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  displayOrder: z.number().int().optional(),
});

function isAdmin(user?: AuthenticatedUser) {
  return user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";
}

// Reads are public; non-admins (including anonymous visitors) only ever see
// published facilities. Mutations stay fully guarded.
@Controller("facilities")
export class FacilitiesController {
  constructor(private readonly facilitiesService: FacilitiesService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  list(@CurrentUser() user: AuthenticatedUser | undefined) {
    return this.facilitiesService.list({ publishedOnly: !isAdmin(user) });
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  create(@Body(new ZodValidationPipe(createSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.facilitiesService.create(dto, user.sub);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  update(@Param("id") id: string, @Body(new ZodValidationPipe(createSchema.partial())) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.facilitiesService.update(id, dto, user.sub);
  }
}

@Module({
  controllers: [FacilitiesController],
  providers: [FacilitiesService],
})
export class FacilitiesModule {}
