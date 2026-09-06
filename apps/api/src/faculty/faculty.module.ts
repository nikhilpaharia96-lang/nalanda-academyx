import { Body, Controller, Get, Injectable, Module, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { eq, and, type SQL } from "drizzle-orm";
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
export class FacultyService {
  constructor(private readonly auditService: AuditService) {}

  list(filters: { department?: string; subject?: string; activeOnly?: boolean } = {}) {
    const conditions: SQL[] = [];
    if (filters.activeOnly) conditions.push(eq(schema.faculty.active, true));
    if (filters.department) conditions.push(eq(schema.faculty.department, filters.department));
    if (filters.subject) conditions.push(eq(schema.faculty.subject, filters.subject));
    return db
      .select()
      .from(schema.faculty)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(schema.faculty.displayOrder);
  }

  async create(dto: { name: string; designation: string; subject?: string; department?: string; qualification?: string; bio?: string; photoUrl?: string; featured?: boolean }, actorId: string) {
    const [row] = await db.insert(schema.faculty).values(dto).returning();
    await this.auditService.log({ userId: actorId, action: "FACULTY_CREATE", entity: "Faculty", entityId: row.id });
    return row;
  }

  async update(id: string, dto: Partial<{ name: string; designation: string; subject: string; department: string; qualification: string; bio: string; photoUrl: string; featured: boolean; active: boolean; displayOrder: number }>, actorId: string) {
    const [row] = await db.update(schema.faculty).set({ ...dto, updatedAt: new Date().toISOString() }).where(eq(schema.faculty.id, id)).returning();
    await this.auditService.log({ userId: actorId, action: "FACULTY_UPDATE", entity: "Faculty", entityId: id });
    return row;
  }
}

const createSchema = z.object({
  name: z.string().min(2),
  designation: z.string().min(1),
  subject: z.string().optional(),
  department: z.string().optional(),
  qualification: z.string().optional(),
  bio: z.string().optional(),
  photoUrl: z.string().url().optional(),
  featured: z.boolean().optional(),
});

function isAdmin(user?: AuthenticatedUser) {
  return user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";
}

// Reads are public; non-admins (including anonymous visitors) only ever see
// active faculty entries. Mutations stay fully guarded.
@Controller("faculty")
export class FacultyController {
  constructor(private readonly facultyService: FacultyService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  list(@Query("department") department: string | undefined, @Query("subject") subject: string | undefined, @CurrentUser() user: AuthenticatedUser | undefined) {
    return this.facultyService.list({ department, subject, activeOnly: !isAdmin(user) });
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  create(@Body(new ZodValidationPipe(createSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.facultyService.create(dto, user.sub);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  update(@Param("id") id: string, @Body(new ZodValidationPipe(createSchema.partial())) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.facultyService.update(id, dto, user.sub);
  }
}

@Module({
  controllers: [FacultyController],
  providers: [FacultyService],
})
export class FacultyModule {}
