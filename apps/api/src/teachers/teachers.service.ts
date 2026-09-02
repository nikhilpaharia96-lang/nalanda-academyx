import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { db, schema } from "@nalanda/database";
import { AuditService } from "../common/audit.service";
import type { AuthenticatedUser } from "../common/types/authenticated-user";

@Injectable()
export class TeachersService {
  constructor(private readonly auditService: AuditService) {}

  list() {
    return db.select().from(schema.teachers).orderBy(schema.teachers.name);
  }

  async getByIdForUser(id: string, user: AuthenticatedUser) {
    const [teacher] = await db.select().from(schema.teachers).where(eq(schema.teachers.id, id));
    if (!teacher) throw new NotFoundException("Teacher not found");
    if (user.role === "TEACHER" && user.profileId !== id) throw new ForbiddenException();
    return teacher;
  }

  async create(
    dto: {
      email: string;
      password?: string;
      name: string;
      subject?: string;
      department?: string;
      qualification?: string;
      phone?: string;
      joiningDate: string;
    },
    actorId: string,
  ) {
    const existing = await db.select().from(schema.users).where(eq(schema.users.email, dto.email));
    if (existing[0]) throw new ConflictException("A user with this email already exists");

    const tempPassword = dto.password || randomBytes(6).toString("base64url");
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    const employeeId = `EMP-${new Date().getFullYear()}-${randomBytes(3).toString("hex").toUpperCase()}`;

    const [user] = await db.insert(schema.users).values({ email: dto.email, passwordHash, role: "TEACHER" }).returning();
    const [teacher] = await db
      .insert(schema.teachers)
      .values({
        userId: user.id,
        employeeId,
        name: dto.name,
        subject: dto.subject,
        department: dto.department,
        qualification: dto.qualification,
        phone: dto.phone,
        email: dto.email,
        joiningDate: dto.joiningDate,
      })
      .returning();

    await this.auditService.log({ userId: actorId, action: "TEACHER_CREATE", entity: "Teacher", entityId: teacher.id });
    return { teacher, temporaryPassword: dto.password ? undefined : tempPassword };
  }

  async update(id: string, dto: Partial<{ name: string; subject: string; department: string; qualification: string; phone: string; status: string }>, actorId: string) {
    const [existing] = await db.select().from(schema.teachers).where(eq(schema.teachers.id, id));
    if (!existing) throw new NotFoundException("Teacher not found");
    const [row] = await db
      .update(schema.teachers)
      .set({ ...dto, updatedAt: new Date().toISOString() })
      .where(eq(schema.teachers.id, id))
      .returning();
    await this.auditService.log({ userId: actorId, action: "TEACHER_UPDATE", entity: "Teacher", entityId: id });
    return row;
  }

  // --- Class assignments ----------------------------------------------------
  async listAssignments(teacherId: string) {
    return db.select().from(schema.teacherClassAssignments).where(eq(schema.teacherClassAssignments.teacherId, teacherId));
  }

  async assign(teacherId: string, dto: { classId: string; sectionId: string; subject: string; academicYearId: string }, actorId: string) {
    const [teacher] = await db.select().from(schema.teachers).where(eq(schema.teachers.id, teacherId));
    if (!teacher) throw new NotFoundException("Teacher not found");

    const existing = await db
      .select()
      .from(schema.teacherClassAssignments)
      .where(
        and(
          eq(schema.teacherClassAssignments.teacherId, teacherId),
          eq(schema.teacherClassAssignments.classId, dto.classId),
          eq(schema.teacherClassAssignments.sectionId, dto.sectionId),
          eq(schema.teacherClassAssignments.subject, dto.subject),
          eq(schema.teacherClassAssignments.academicYearId, dto.academicYearId),
        ),
      );
    if (existing[0]) throw new ConflictException("This assignment already exists");

    const [row] = await db.insert(schema.teacherClassAssignments).values({ teacherId, ...dto }).returning();
    await this.auditService.log({ userId: actorId, action: "TEACHER_ASSIGN", entity: "TeacherClassAssignment", entityId: row.id });
    return row;
  }

  async unassign(assignmentId: string, actorId: string) {
    const [existing] = await db.select().from(schema.teacherClassAssignments).where(eq(schema.teacherClassAssignments.id, assignmentId));
    if (!existing) throw new NotFoundException("Assignment not found");
    await db.delete(schema.teacherClassAssignments).where(eq(schema.teacherClassAssignments.id, assignmentId));
    await this.auditService.log({ userId: actorId, action: "TEACHER_UNASSIGN", entity: "TeacherClassAssignment", entityId: assignmentId });
    return { success: true };
  }
}
