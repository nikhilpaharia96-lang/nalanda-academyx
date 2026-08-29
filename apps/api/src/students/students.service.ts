import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import bcrypt from "bcryptjs";
import { and, eq, like, or, sql, type SQL } from "drizzle-orm";
import { db, schema } from "@nalanda/database";
import type { CreateStudentDto, ListStudentsQuery, UpdateStudentDto } from "@nalanda/shared";
import { AuditService } from "../common/audit.service";
import type { AuthenticatedUser } from "../common/types/authenticated-user";
import { randomBytes } from "crypto";

@Injectable()
export class StudentsService {
  constructor(private readonly auditService: AuditService) {}

  async list(query: ListStudentsQuery) {
    const conditions: SQL[] = [];
    if (query.classId) conditions.push(eq(schema.students.classId, query.classId));
    if (query.sectionId) conditions.push(eq(schema.students.sectionId, query.sectionId));
    if (query.status) conditions.push(eq(schema.students.status, query.status));
    if (query.search) {
      const searchClause = or(
        like(schema.students.name, `%${query.search}%`),
        like(schema.students.studentId, `%${query.search}%`),
        like(schema.students.admissionNumber, `%${query.search}%`),
      );
      if (searchClause) conditions.push(searchClause);
    }
    const where = conditions.length ? and(...conditions) : undefined;

    const [rows, [{ count }]] = await Promise.all([
      db
        .select()
        .from(schema.students)
        .where(where)
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize)
        .orderBy(schema.students.name),
      db.select({ count: sql<number>`count(*)` }).from(schema.students).where(where),
    ]);

    return {
      data: rows,
      pagination: { page: query.page, pageSize: query.pageSize, total: Number(count) },
    };
  }

  /** Enforces resource ownership: STUDENT can only see themselves, PARENT only linked children, TEACHER only assigned classes, ADMIN/SUPER_ADMIN unrestricted. */
  async getByIdForUser(studentId: string, user: AuthenticatedUser) {
    const [student] = await db.select().from(schema.students).where(eq(schema.students.id, studentId));
    if (!student) throw new NotFoundException("Student not found");

    if (user.role === "STUDENT") {
      if (student.id !== user.profileId) throw new ForbiddenException();
    } else if (user.role === "PARENT") {
      const link = await db
        .select()
        .from(schema.parentStudents)
        .where(and(eq(schema.parentStudents.parentId, user.profileId!), eq(schema.parentStudents.studentId, studentId)));
      if (link.length === 0) throw new ForbiddenException();
    } else if (user.role === "TEACHER") {
      const assignment = await db
        .select()
        .from(schema.teacherClassAssignments)
        .where(
          and(
            eq(schema.teacherClassAssignments.teacherId, user.profileId!),
            eq(schema.teacherClassAssignments.classId, student.classId),
            eq(schema.teacherClassAssignments.sectionId, student.sectionId),
          ),
        );
      if (assignment.length === 0) throw new ForbiddenException();
    }
    // ADMIN / SUPER_ADMIN: unrestricted.

    return student;
  }

  async create(dto: CreateStudentDto, actingUserId: string) {
    const existingUser = await db.select().from(schema.users).where(eq(schema.users.email, dto.email));
    if (existingUser[0]) throw new ConflictException("A user with this email already exists");

    const tempPassword = dto.password || randomBytes(6).toString("base64url");
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const studentId = `STU-${new Date().getFullYear()}-${randomBytes(3).toString("hex").toUpperCase()}`;
    const admissionNumber = `ADM-${new Date().getFullYear()}-${randomBytes(3).toString("hex").toUpperCase()}`;

    const [user] = await db.insert(schema.users).values({ email: dto.email, passwordHash, role: "STUDENT" }).returning();

    const [student] = await db
      .insert(schema.students)
      .values({
        userId: user.id,
        studentId,
        admissionNumber,
        name: dto.name,
        dateOfBirth: dto.dateOfBirth,
        gender: dto.gender,
        classId: dto.classId,
        sectionId: dto.sectionId,
        academicYearId: dto.academicYearId,
        rollNumber: dto.rollNumber,
        admissionDate: dto.admissionDate,
        address: dto.address,
      })
      .returning();

    await this.auditService.log({
      userId: actingUserId,
      action: "STUDENT_CREATE",
      entity: "Student",
      entityId: student.id,
      description: `Created student ${student.name} (${student.studentId})`,
    });

    return { student, temporaryPassword: dto.password ? undefined : tempPassword };
  }

  async update(studentId: string, dto: UpdateStudentDto, actingUserId: string) {
    const [existing] = await db.select().from(schema.students).where(eq(schema.students.id, studentId));
    if (!existing) throw new NotFoundException("Student not found");

    const [updated] = await db
      .update(schema.students)
      .set({ ...dto, updatedAt: new Date().toISOString() })
      .where(eq(schema.students.id, studentId))
      .returning();

    await this.auditService.log({
      userId: actingUserId,
      action: "STUDENT_UPDATE",
      entity: "Student",
      entityId: studentId,
      description: `Updated fields: ${Object.keys(dto).join(", ")}`,
    });

    return updated;
  }

  async deactivate(studentId: string, actingUserId: string) {
    const [existing] = await db.select().from(schema.students).where(eq(schema.students.id, studentId));
    if (!existing) throw new NotFoundException("Student not found");

    await db.update(schema.students).set({ status: "INACTIVE" }).where(eq(schema.students.id, studentId));
    await db.update(schema.users).set({ status: "INACTIVE" }).where(eq(schema.users.id, existing.userId));

    await this.auditService.log({
      userId: actingUserId,
      action: "STUDENT_DEACTIVATE",
      entity: "Student",
      entityId: studentId,
    });

    return { success: true };
  }
}
