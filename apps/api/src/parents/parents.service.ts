import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { db, schema } from "@nalanda/database";
import { AuditService } from "../common/audit.service";
import type { AuthenticatedUser } from "../common/types/authenticated-user";

@Injectable()
export class ParentsService {
  constructor(private readonly auditService: AuditService) {}

  list() {
    return db.select().from(schema.parents).orderBy(schema.parents.name);
  }

  async getByIdForUser(id: string, user: AuthenticatedUser) {
    const [parent] = await db.select().from(schema.parents).where(eq(schema.parents.id, id));
    if (!parent) throw new NotFoundException("Parent not found");
    if (user.role === "PARENT" && user.profileId !== id) throw new ForbiddenException();
    return parent;
  }

  async getChildren(parentId: string, user: AuthenticatedUser) {
    if (user.role === "PARENT" && user.profileId !== parentId) throw new ForbiddenException();
    const links = await db.select().from(schema.parentStudents).where(eq(schema.parentStudents.parentId, parentId));
    const students = await Promise.all(
      links.map(async (link) => {
        const [student] = await db.select().from(schema.students).where(eq(schema.students.id, link.studentId));
        return { ...student, relationship: link.relationship, isPrimary: link.isPrimary };
      }),
    );
    return students;
  }

  async create(dto: { email: string; password?: string; name: string; phone: string; address?: string }, actorId: string) {
    const existing = await db.select().from(schema.users).where(eq(schema.users.email, dto.email));
    if (existing[0]) throw new ConflictException("A user with this email already exists");

    const tempPassword = dto.password || randomBytes(6).toString("base64url");
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const [user] = await db.insert(schema.users).values({ email: dto.email, passwordHash, role: "PARENT" }).returning();
    const [parent] = await db
      .insert(schema.parents)
      .values({ userId: user.id, name: dto.name, phone: dto.phone, email: dto.email, address: dto.address })
      .returning();

    await this.auditService.log({ userId: actorId, action: "PARENT_CREATE", entity: "Parent", entityId: parent.id });
    return { parent, temporaryPassword: dto.password ? undefined : tempPassword };
  }

  async linkStudent(parentId: string, dto: { studentId: string; relationship: string; isPrimary?: boolean }, actorId: string) {
    const [parent] = await db.select().from(schema.parents).where(eq(schema.parents.id, parentId));
    if (!parent) throw new NotFoundException("Parent not found");
    const [student] = await db.select().from(schema.students).where(eq(schema.students.id, dto.studentId));
    if (!student) throw new NotFoundException("Student not found");

    const existing = await db
      .select()
      .from(schema.parentStudents)
      .where(and(eq(schema.parentStudents.parentId, parentId), eq(schema.parentStudents.studentId, dto.studentId)));
    if (existing[0]) throw new ConflictException("This parent is already linked to this student");

    const [row] = await db.insert(schema.parentStudents).values({ parentId, ...dto }).returning();
    await this.auditService.log({ userId: actorId, action: "PARENT_LINK_STUDENT", entity: "ParentStudent", entityId: row.id });
    return row;
  }

  async unlinkStudent(linkId: string, actorId: string) {
    const [existing] = await db.select().from(schema.parentStudents).where(eq(schema.parentStudents.id, linkId));
    if (!existing) throw new NotFoundException("Link not found");
    await db.delete(schema.parentStudents).where(eq(schema.parentStudents.id, linkId));
    await this.auditService.log({ userId: actorId, action: "PARENT_UNLINK_STUDENT", entity: "ParentStudent", entityId: linkId });
    return { success: true };
  }
}
