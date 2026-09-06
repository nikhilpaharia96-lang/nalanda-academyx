import { Body, Controller, ForbiddenException, Get, Injectable, Module, NotFoundException, Param, Post, UseGuards } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@nalanda/database";
import { AuditService } from "../common/audit.service";
import { OwnershipService } from "../common/ownership.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import type { AuthenticatedUser } from "../common/types/authenticated-user";

@Injectable()
export class DocumentsService {
  constructor(
    private readonly auditService: AuditService,
    private readonly ownershipService: OwnershipService,
  ) {}

  /** Records document metadata. NOTE: this does not actually upload bytes to
   * cloud storage — that's Phase 11 (Cloudflare R2/S3), which needs network
   * egress this sandbox doesn't have. `fileUrl` here is whatever the caller
   * supplies (e.g. a pre-signed upload target in production); the ownership,
   * visibility, and metadata handling around it is real. */
  async create(
    dto: { studentId?: string; name: string; fileUrl: string; fileType: string; fileSize: number; category: string; visibility?: string },
    user: AuthenticatedUser,
  ) {
    if (dto.studentId) await this.ownershipService.assertCanAccessStudent(dto.studentId, user);
    const [row] = await db
      .insert(schema.documents)
      .values({ ownerUserId: user.sub, ...dto, visibility: dto.visibility || "PRIVATE" })
      .returning();
    await this.auditService.log({ userId: user.sub, action: "DOCUMENT_UPLOAD", entity: "Document", entityId: row.id });
    return row;
  }

  async listMine(userId: string) {
    return db.select().from(schema.documents).where(eq(schema.documents.ownerUserId, userId));
  }

  async listForStudent(studentId: string, user: AuthenticatedUser) {
    await this.ownershipService.assertCanAccessStudent(studentId, user);
    const isAdmin = user.role === "SUPER_ADMIN" || user.role === "ADMIN";
    const rows = await db.select().from(schema.documents).where(eq(schema.documents.studentId, studentId));
    return isAdmin ? rows : rows.filter((d) => d.visibility === "SHARED" || d.ownerUserId === user.sub);
  }

  async getById(id: string, user: AuthenticatedUser) {
    const [row] = await db.select().from(schema.documents).where(eq(schema.documents.id, id));
    if (!row) throw new NotFoundException("Document not found");
    const isAdmin = user.role === "SUPER_ADMIN" || user.role === "ADMIN";
    if (isAdmin) return row;
    if (row.ownerUserId === user.sub) return row;
    if (row.studentId && row.visibility === "SHARED") {
      await this.ownershipService.assertCanAccessStudent(row.studentId, user);
      return row;
    }
    throw new ForbiddenException();
  }
}

const createSchema = z.object({
  studentId: z.string().optional(),
  name: z.string().min(1),
  fileUrl: z.string().url(),
  fileType: z.string().min(1),
  fileSize: z.number().int().nonnegative(),
  category: z.string().min(1),
  visibility: z.enum(["PRIVATE", "SHARED"]).optional(),
});

@Controller("documents")
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  create(@Body(new ZodValidationPipe(createSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.documentsService.create(dto, user);
  }

  @Get("mine")
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.documentsService.listMine(user.sub);
  }

  @Get("student/:studentId")
  listForStudent(@Param("studentId") studentId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.documentsService.listForStudent(studentId, user);
  }

  @Get(":id")
  getById(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.documentsService.getById(id, user);
  }
}

@Module({
  controllers: [DocumentsController],
  providers: [DocumentsService],
})
export class DocumentsModule {}
