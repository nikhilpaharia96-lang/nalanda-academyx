import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { and, desc, eq, gte, lte, type SQL } from "drizzle-orm";
import { db, schema } from "@nalanda/database";
import { AuditService } from "../common/audit.service";
import { OwnershipService } from "../common/ownership.service";
import type { AuthenticatedUser } from "../common/types/authenticated-user";

const isAdmin = (u: AuthenticatedUser) => u.role === "SUPER_ADMIN" || u.role === "ADMIN";

export interface HomeworkFilters {
  classId?: string;
  sectionId?: string;
  academicYearId?: string;
  studentId?: string; // for parents: which child
  from?: string;
  to?: string;
}

@Injectable()
export class HomeworkService {
  constructor(
    private readonly auditService: AuditService,
    private readonly ownershipService: OwnershipService,
  ) {}

  async create(
    dto: { classId: string; sectionId: string; academicYearId: string; subjectId: string; title: string; description?: string; dueDate: string },
    user: AuthenticatedUser,
  ) {
    if (!isAdmin(user) && user.role !== "TEACHER") throw new ForbiddenException();
    await this.ownershipService.assertTeacherAssignedToClass(dto.classId, dto.sectionId, user);

    const [section] = await db.select().from(schema.sections).where(eq(schema.sections.id, dto.sectionId));
    if (!section || section.classId !== dto.classId) throw new ConflictException("Section does not belong to this class");
    const [subject] = await db.select().from(schema.subjects).where(eq(schema.subjects.id, dto.subjectId));
    if (!subject) throw new NotFoundException("Subject not found");

    const [row] = await db
      .insert(schema.homework)
      .values({ ...dto, teacherId: user.role === "TEACHER" ? user.profileId! : null, createdByUserId: user.sub })
      .returning();
    await this.auditService.log({ userId: user.sub, action: "HOMEWORK_CREATE", entity: "Homework", entityId: row.id });
    return row;
  }

  private async getEditable(id: string, user: AuthenticatedUser) {
    const [row] = await db.select().from(schema.homework).where(eq(schema.homework.id, id));
    if (!row) throw new NotFoundException("Homework not found");
    if (!isAdmin(user)) {
      // A teacher may only touch homework they posted, and only while still assigned to that class.
      if (user.role !== "TEACHER" || row.teacherId !== user.profileId) throw new ForbiddenException();
      await this.ownershipService.assertTeacherAssignedToClass(row.classId, row.sectionId, user);
    }
    return row;
  }

  async update(id: string, dto: { subjectId?: string; title?: string; description?: string; dueDate?: string }, user: AuthenticatedUser) {
    await this.getEditable(id, user);
    const [row] = await db.update(schema.homework).set({ ...dto, updatedAt: new Date().toISOString() }).where(eq(schema.homework.id, id)).returning();
    await this.auditService.log({ userId: user.sub, action: "HOMEWORK_UPDATE", entity: "Homework", entityId: id });
    return row;
  }

  async remove(id: string, user: AuthenticatedUser) {
    await this.getEditable(id, user);
    await db.delete(schema.homework).where(eq(schema.homework.id, id));
    await this.auditService.log({ userId: user.sub, action: "HOMEWORK_DELETE", entity: "Homework", entityId: id });
    return { deleted: true };
  }

  async list(user: AuthenticatedUser, filters: HomeworkFilters = {}) {
    const conds: SQL[] = [];
    let allowedPairs: Set<string> | null = null; // "classId|sectionId" a teacher may see

    if (user.role === "STUDENT") {
      const [me] = await db.select().from(schema.students).where(eq(schema.students.id, user.profileId!));
      if (!me) throw new NotFoundException("Student not found");
      conds.push(eq(schema.homework.classId, me.classId), eq(schema.homework.sectionId, me.sectionId), eq(schema.homework.academicYearId, me.academicYearId));
    } else if (user.role === "PARENT") {
      if (!filters.studentId) throw new ForbiddenException("studentId is required");
      await this.ownershipService.assertCanAccessStudent(filters.studentId, user);
      const [child] = await db.select().from(schema.students).where(eq(schema.students.id, filters.studentId));
      if (!child) throw new NotFoundException("Student not found");
      conds.push(eq(schema.homework.classId, child.classId), eq(schema.homework.sectionId, child.sectionId), eq(schema.homework.academicYearId, child.academicYearId));
    } else if (user.role === "TEACHER") {
      const mine = await db.select().from(schema.teacherClassAssignments).where(eq(schema.teacherClassAssignments.teacherId, user.profileId!));
      allowedPairs = new Set(mine.map((a) => `${a.classId}|${a.sectionId}`));
      if (filters.classId) conds.push(eq(schema.homework.classId, filters.classId));
      if (filters.sectionId) conds.push(eq(schema.homework.sectionId, filters.sectionId));
      if (filters.academicYearId) conds.push(eq(schema.homework.academicYearId, filters.academicYearId));
    } else if (isAdmin(user)) {
      if (filters.classId) conds.push(eq(schema.homework.classId, filters.classId));
      if (filters.sectionId) conds.push(eq(schema.homework.sectionId, filters.sectionId));
      if (filters.academicYearId) conds.push(eq(schema.homework.academicYearId, filters.academicYearId));
    } else {
      throw new ForbiddenException();
    }
    if (filters.from) conds.push(gte(schema.homework.dueDate, filters.from));
    if (filters.to) conds.push(lte(schema.homework.dueDate, filters.to));

    const rows = await db
      .select({
        id: schema.homework.id,
        classId: schema.homework.classId,
        sectionId: schema.homework.sectionId,
        title: schema.homework.title,
        description: schema.homework.description,
        dueDate: schema.homework.dueDate,
        createdAt: schema.homework.createdAt,
        subjectId: schema.subjects.id,
        subjectName: schema.subjects.name,
        teacherId: schema.homework.teacherId,
        teacherName: schema.teachers.name,
      })
      .from(schema.homework)
      .innerJoin(schema.subjects, eq(schema.subjects.id, schema.homework.subjectId))
      .leftJoin(schema.teachers, eq(schema.teachers.id, schema.homework.teacherId))
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(desc(schema.homework.dueDate))
      .limit(300);

    return allowedPairs ? rows.filter((r) => allowedPairs!.has(`${r.classId}|${r.sectionId}`)) : rows;
  }
}
