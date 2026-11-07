import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { and, desc, eq, inArray, type SQL } from "drizzle-orm";
import { db, schema } from "@nalanda/database";
import { AuditService } from "../common/audit.service";
import { OwnershipService } from "../common/ownership.service";
import type { AuthenticatedUser } from "../common/types/authenticated-user";

const isAdmin = (u: AuthenticatedUser) => u.role === "SUPER_ADMIN" || u.role === "ADMIN";
const MAX_DAYS = 31;
const dayCount = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / 864e5) + 1;

@Injectable()
export class LeaveService {
  constructor(
    private readonly auditService: AuditService,
    private readonly ownershipService: OwnershipService,
  ) {}

  /** Students apply for themselves; parents for a linked child; admins on anyone's behalf. */
  async apply(dto: { studentId?: string; fromDate: string; toDate: string; reason: string }, user: AuthenticatedUser) {
    let studentId: string;
    if (user.role === "STUDENT") studentId = user.profileId!;
    else if (user.role === "PARENT" || isAdmin(user)) {
      if (!dto.studentId) throw new BadRequestException("studentId is required");
      studentId = dto.studentId;
      await this.ownershipService.assertCanAccessStudent(studentId, user);
    } else throw new ForbiddenException();

    if (dto.toDate < dto.fromDate) throw new BadRequestException("toDate cannot be before fromDate");
    if (dayCount(dto.fromDate, dto.toDate) > MAX_DAYS) throw new BadRequestException(`Leave cannot exceed ${MAX_DAYS} days; please split the request`);

    const [student] = await db.select().from(schema.students).where(eq(schema.students.id, studentId));
    if (!student) throw new NotFoundException("Student not found");

    const open = await db
      .select()
      .from(schema.leaveRequests)
      .where(and(eq(schema.leaveRequests.studentId, studentId), inArray(schema.leaveRequests.status, ["PENDING", "APPROVED"])));
    const overlap = open.find((r) => r.fromDate <= dto.toDate && r.toDate >= dto.fromDate);
    if (overlap) throw new ConflictException("An existing leave request already covers some of these dates");

    const [row] = await db
      .insert(schema.leaveRequests)
      .values({ studentId, fromDate: dto.fromDate, toDate: dto.toDate, reason: dto.reason.trim(), appliedByUserId: user.sub })
      .returning();
    await this.auditService.log({ userId: user.sub, action: "LEAVE_APPLY", entity: "LeaveRequest", entityId: row.id });
    return row;
  }

  private async getOrThrow(id: string) {
    const [row] = await db.select().from(schema.leaveRequests).where(eq(schema.leaveRequests.id, id));
    if (!row) throw new NotFoundException("Leave request not found");
    return row;
  }

  /** Applicants can withdraw a request that is still pending. */
  async cancel(id: string, user: AuthenticatedUser) {
    const row = await this.getOrThrow(id);
    await this.ownershipService.assertCanAccessStudent(row.studentId, user);
    if (user.role === "TEACHER") throw new ForbiddenException();
    if (row.status !== "PENDING") throw new ConflictException("Only pending requests can be cancelled");
    const [updated] = await db
      .update(schema.leaveRequests)
      .set({ status: "CANCELLED", updatedAt: new Date().toISOString() })
      .where(and(eq(schema.leaveRequests.id, id), eq(schema.leaveRequests.status, "PENDING")))
      .returning();
    if (!updated) throw new ConflictException("Request was changed by someone else; please refresh");
    await this.auditService.log({ userId: user.sub, action: "LEAVE_CANCEL", entity: "LeaveRequest", entityId: id });
    return updated;
  }

  /** Admins, or the teacher assigned to the student's class/section. Students and parents can never approve. */
  async review(id: string, dto: { decision: "APPROVED" | "REJECTED"; note?: string }, user: AuthenticatedUser) {
    if (!isAdmin(user) && user.role !== "TEACHER") throw new ForbiddenException();
    const row = await this.getOrThrow(id);
    if (user.role === "TEACHER") {
      const [student] = await db.select().from(schema.students).where(eq(schema.students.id, row.studentId));
      if (!student) throw new NotFoundException("Student not found");
      await this.ownershipService.assertTeacherAssignedToClass(student.classId, student.sectionId, user);
    }
    if (row.status !== "PENDING") throw new ConflictException(`Request is already ${row.status}`);

    const now = new Date().toISOString();
    const [updated] = await db
      .update(schema.leaveRequests)
      .set({ status: dto.decision, reviewNote: dto.note ?? null, reviewedByUserId: user.sub, reviewedAt: now, updatedAt: now })
      .where(and(eq(schema.leaveRequests.id, id), eq(schema.leaveRequests.status, "PENDING")))
      .returning();
    if (!updated) throw new ConflictException("Request was changed by someone else; please refresh");
    await this.auditService.log({ userId: user.sub, action: `LEAVE_${dto.decision}`, entity: "LeaveRequest", entityId: id });
    return updated;
  }

  async list(user: AuthenticatedUser, filters: { status?: string; studentId?: string } = {}) {
    const conds: SQL[] = [];
    if (filters.status) conds.push(eq(schema.leaveRequests.status, filters.status));

    if (isAdmin(user)) {
      if (filters.studentId) conds.push(eq(schema.leaveRequests.studentId, filters.studentId));
    } else if (user.role === "STUDENT") {
      conds.push(eq(schema.leaveRequests.studentId, user.profileId!));
    } else if (user.role === "PARENT") {
      const ids = await this.ownershipService.getLinkedStudentIds(user.profileId!);
      if (filters.studentId) {
        if (!ids.includes(filters.studentId)) throw new ForbiddenException();
        conds.push(eq(schema.leaveRequests.studentId, filters.studentId));
      } else {
        if (ids.length === 0) return [];
        conds.push(inArray(schema.leaveRequests.studentId, ids));
      }
    } else if (user.role === "TEACHER") {
      // Only students in the class/sections this teacher is assigned to.
      const mine = await db.select().from(schema.teacherClassAssignments).where(eq(schema.teacherClassAssignments.teacherId, user.profileId!));
      const pairs = new Set(mine.map((a) => `${a.classId}|${a.sectionId}`));
      if (pairs.size === 0) return [];
      const rows = await this.query(conds);
      return rows.filter((r) => pairs.has(`${r.classId}|${r.sectionId}`) && (!filters.studentId || r.studentId === filters.studentId));
    } else throw new ForbiddenException();

    return this.query(conds);
  }

  private query(conds: SQL[]) {
    return db
      .select({
        id: schema.leaveRequests.id,
        status: schema.leaveRequests.status,
        fromDate: schema.leaveRequests.fromDate,
        toDate: schema.leaveRequests.toDate,
        reason: schema.leaveRequests.reason,
        reviewNote: schema.leaveRequests.reviewNote,
        reviewedAt: schema.leaveRequests.reviewedAt,
        createdAt: schema.leaveRequests.createdAt,
        studentId: schema.students.id,
        studentName: schema.students.name,
        classId: schema.students.classId,
        sectionId: schema.students.sectionId,
      })
      .from(schema.leaveRequests)
      .innerJoin(schema.students, eq(schema.students.id, schema.leaveRequests.studentId))
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(desc(schema.leaveRequests.createdAt))
      .limit(300);
  }
}
