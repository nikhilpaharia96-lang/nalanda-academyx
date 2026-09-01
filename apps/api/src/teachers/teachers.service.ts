import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { db, schema } from "@nalanda/database";
import { AuditService } from "../common/audit.service";
import { toFriendlyConflictError } from "../common/db-errors";
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

  /** Mirrors StudentsService.resolveLoginEmail — see that method's comment
   * for why a synthetic institutional email is used as the login identifier
   * instead of introducing a separate username system. */
  private async resolveLoginEmail(providedEmail: string | undefined, employeeId: string): Promise<string> {
    if (providedEmail) return providedEmail;
    let candidate = `${employeeId.toLowerCase()}@staff.nalanda.cloud`;
    let attempt = 0;
    while (attempt < 5) {
      const [existing] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, candidate));
      if (!existing) return candidate;
      attempt += 1;
      candidate = `${employeeId.toLowerCase()}-${randomBytes(2).toString("hex")}@staff.nalanda.cloud`;
    }
    return candidate;
  }

  async create(
    dto: {
      email?: string;
      password?: string;
      name: string;
      dateOfBirth?: string;
      gender?: string;
      subject?: string;
      department?: string;
      qualification?: string;
      designation?: string;
      phone?: string;
      address?: string;
      employeeId?: string;
      joiningDate: string;
    },
    actorId: string,
  ) {
    // The existing convention here is "EMP-" (not the "TCH-" suggested
    // elsewhere) — kept as-is per the instruction to reuse an existing,
    // already-working ID convention rather than introduce a second one.
    const employeeId = dto.employeeId || `EMP-${new Date().getFullYear()}-${randomBytes(3).toString("hex").toUpperCase()}`;
    if (dto.employeeId) {
      const existingId = await db.select().from(schema.teachers).where(eq(schema.teachers.employeeId, employeeId));
      if (existingId[0]) throw new ConflictException("A teacher with this employee ID already exists");
    }

    const loginEmail = await this.resolveLoginEmail(dto.email, employeeId);
    const existingUser = await db.select().from(schema.users).where(eq(schema.users.email, loginEmail));
    if (existingUser[0]) throw new ConflictException("A user with this email already exists");

    const tempPassword = dto.password || randomBytes(9).toString("base64url");
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // See StudentsService.create for why this is a compensating-delete
    // pattern rather than a real DB transaction (better-sqlite3's driver
    // rejects async transaction callbacks in this dual-dialect setup).
    const [user] = await db
      .insert(schema.users)
      .values({ email: loginEmail, passwordHash, role: "TEACHER", mustChangePassword: true })
      .returning();

    let teacher;
    try {
      [teacher] = await db
        .insert(schema.teachers)
        .values({
          userId: user.id,
          employeeId,
          name: dto.name,
          subject: dto.subject,
          department: dto.department,
          qualification: dto.qualification,
          designation: dto.designation,
          phone: dto.phone,
          email: dto.email || null,
          dateOfBirth: dto.dateOfBirth,
          gender: dto.gender,
          address: dto.address,
          joiningDate: dto.joiningDate,
        })
        .returning();
    } catch (err) {
      await db.delete(schema.users).where(eq(schema.users.id, user.id));
      throw toFriendlyConflictError(err, "employee ID");
    }

    await this.auditService.log({ userId: actorId, action: "TEACHER_CREATE", entity: "Teacher", entityId: teacher.id });
    return { teacher, loginEmail, temporaryPassword: dto.password ? undefined : tempPassword };
  }

  /** Admin-only password reset — mirrors StudentsService.resetPassword. */
  async resetPassword(teacherId: string, actorId: string) {
    const [teacher] = await db.select().from(schema.teachers).where(eq(schema.teachers.id, teacherId));
    if (!teacher) throw new NotFoundException("Teacher not found");

    const tempPassword = randomBytes(9).toString("base64url");
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    await db.update(schema.users).set({ passwordHash, mustChangePassword: true }).where(eq(schema.users.id, teacher.userId));
    await db.update(schema.refreshTokens).set({ revoked: true }).where(eq(schema.refreshTokens.userId, teacher.userId));

    await this.auditService.log({
      userId: actorId,
      action: "TEACHER_PASSWORD_RESET",
      entity: "Teacher",
      entityId: teacherId,
      description: `Password reset for teacher ${teacher.name} (${teacher.employeeId})`,
    });

    return { temporaryPassword: tempPassword };
  }

  async setActive(teacherId: string, active: boolean, actorId: string) {
    const [existing] = await db.select().from(schema.teachers).where(eq(schema.teachers.id, teacherId));
    if (!existing) throw new NotFoundException("Teacher not found");

    const status = active ? "ACTIVE" : "INACTIVE";
    await db.update(schema.teachers).set({ status }).where(eq(schema.teachers.id, teacherId));
    await db.update(schema.users).set({ status }).where(eq(schema.users.id, existing.userId));

    await this.auditService.log({
      userId: actorId,
      action: active ? "TEACHER_ACTIVATE" : "TEACHER_DEACTIVATE",
      entity: "Teacher",
      entityId: teacherId,
    });

    return { success: true };
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
