import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@nalanda/database";
import type { TimetableEntryDto } from "@nalanda/shared";
import { AuditService } from "../common/audit.service";
import { OwnershipService } from "../common/ownership.service";
import { toFriendlyConflictError } from "../common/db-errors";
import type { AuthenticatedUser } from "../common/types/authenticated-user";

@Injectable()
export class TimetableService {
  constructor(
    private readonly auditService: AuditService,
    private readonly ownershipService: OwnershipService,
  ) {}

  // --- Time slots (periods) --------------------------------------------------
  listSlots() {
    return db.select().from(schema.timeSlots).orderBy(schema.timeSlots.displayOrder, schema.timeSlots.startTime);
  }

  async createSlot(dto: { name: string; startTime: string; endTime: string; displayOrder?: number }, actorId: string) {
    try {
      const [row] = await db.insert(schema.timeSlots).values(dto).returning();
      await this.auditService.log({ userId: actorId, action: "TIME_SLOT_CREATE", entity: "TimeSlot", entityId: row.id });
      return row;
    } catch (err) {
      throw toFriendlyConflictError(err, "name");
    }
  }

  async updateSlot(
    id: string,
    dto: Partial<{ name: string; startTime: string; endTime: string; displayOrder: number; active: boolean }>,
    actorId: string,
  ) {
    const [existing] = await db.select().from(schema.timeSlots).where(eq(schema.timeSlots.id, id));
    if (!existing) throw new NotFoundException("Time slot not found");
    const start = dto.startTime ?? existing.startTime;
    const end = dto.endTime ?? existing.endTime;
    if (start >= end) throw new ConflictException("endTime must be after startTime");
    try {
      const [row] = await db
        .update(schema.timeSlots)
        .set({ ...dto, updatedAt: new Date().toISOString() })
        .where(eq(schema.timeSlots.id, id))
        .returning();
      await this.auditService.log({ userId: actorId, action: "TIME_SLOT_UPDATE", entity: "TimeSlot", entityId: id });
      return row;
    } catch (err) {
      throw toFriendlyConflictError(err, "name");
    }
  }

  // --- Entries ---------------------------------------------------------------
  /**
   * Creates or replaces the entry for (class, section, year, day, slot).
   * A teacher can't be in two classes in the same slot on the same day.
   */
  async setEntry(dto: TimetableEntryDto, actorId: string) {
    const [slot] = await db.select().from(schema.timeSlots).where(eq(schema.timeSlots.id, dto.timeSlotId));
    if (!slot) throw new NotFoundException("Time slot not found");

    const [section] = await db.select().from(schema.sections).where(eq(schema.sections.id, dto.sectionId));
    if (!section || section.classId !== dto.classId) throw new ConflictException("Section does not belong to this class");

    if (dto.teacherId) {
      const [clash] = await db
        .select()
        .from(schema.timetableEntries)
        .where(
          and(
            eq(schema.timetableEntries.teacherId, dto.teacherId),
            eq(schema.timetableEntries.academicYearId, dto.academicYearId),
            eq(schema.timetableEntries.dayOfWeek, dto.dayOfWeek),
            eq(schema.timetableEntries.timeSlotId, dto.timeSlotId),
          ),
        );
      const sameCell = clash && clash.classId === dto.classId && clash.sectionId === dto.sectionId;
      if (clash && !sameCell) throw new ConflictException("This teacher is already scheduled in another class at that time");
    }

    const [existing] = await db
      .select()
      .from(schema.timetableEntries)
      .where(
        and(
          eq(schema.timetableEntries.classId, dto.classId),
          eq(schema.timetableEntries.sectionId, dto.sectionId),
          eq(schema.timetableEntries.academicYearId, dto.academicYearId),
          eq(schema.timetableEntries.dayOfWeek, dto.dayOfWeek),
          eq(schema.timetableEntries.timeSlotId, dto.timeSlotId),
        ),
      );

    try {
      if (existing) {
        const [row] = await db
          .update(schema.timetableEntries)
          .set({
            subjectId: dto.subjectId,
            teacherId: dto.teacherId ?? null,
            room: dto.room ?? null,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(schema.timetableEntries.id, existing.id))
          .returning();
        await this.auditService.log({ userId: actorId, action: "TIMETABLE_UPDATE", entity: "TimetableEntry", entityId: row.id });
        return row;
      }
      const [row] = await db.insert(schema.timetableEntries).values(dto).returning();
      await this.auditService.log({ userId: actorId, action: "TIMETABLE_CREATE", entity: "TimetableEntry", entityId: row.id });
      return row;
    } catch (err) {
      throw toFriendlyConflictError(err, "timetable slot");
    }
  }

  async deleteEntry(id: string, actorId: string) {
    const [row] = await db.delete(schema.timetableEntries).where(eq(schema.timetableEntries.id, id)).returning();
    if (!row) throw new NotFoundException("Timetable entry not found");
    await this.auditService.log({ userId: actorId, action: "TIMETABLE_DELETE", entity: "TimetableEntry", entityId: id });
    return { deleted: true };
  }

  // --- Reads -----------------------------------------------------------------
  private selectEntries() {
    return db
      .select({
        id: schema.timetableEntries.id,
        classId: schema.timetableEntries.classId,
        sectionId: schema.timetableEntries.sectionId,
        dayOfWeek: schema.timetableEntries.dayOfWeek,
        room: schema.timetableEntries.room,
        timeSlotId: schema.timeSlots.id,
        slotName: schema.timeSlots.name,
        startTime: schema.timeSlots.startTime,
        endTime: schema.timeSlots.endTime,
        subjectId: schema.subjects.id,
        subjectName: schema.subjects.name,
        teacherId: schema.teachers.id,
        teacherName: schema.teachers.name,
      })
      .from(schema.timetableEntries)
      .innerJoin(schema.timeSlots, eq(schema.timeSlots.id, schema.timetableEntries.timeSlotId))
      .innerJoin(schema.subjects, eq(schema.subjects.id, schema.timetableEntries.subjectId))
      .leftJoin(schema.teachers, eq(schema.teachers.id, schema.timetableEntries.teacherId));
  }

  /** Teachers may only see classes they're assigned to; students/parents use getForStudent. */
  async getForClass(classId: string, sectionId: string, academicYearId: string, user: AuthenticatedUser) {
    if (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN" && user.role !== "TEACHER") throw new ForbiddenException();
    await this.ownershipService.assertTeacherAssignedToClass(classId, sectionId, user);
    return this.selectEntries()
      .where(
        and(
          eq(schema.timetableEntries.classId, classId),
          eq(schema.timetableEntries.sectionId, sectionId),
          eq(schema.timetableEntries.academicYearId, academicYearId),
        ),
      )
      .orderBy(schema.timetableEntries.dayOfWeek, schema.timeSlots.displayOrder, schema.timeSlots.startTime);
  }

  async getForStudent(studentId: string, user: AuthenticatedUser) {
    await this.ownershipService.assertCanAccessStudent(studentId, user);
    const [student] = await db.select().from(schema.students).where(eq(schema.students.id, studentId));
    if (!student) throw new NotFoundException("Student not found");
    return this.selectEntries()
      .where(
        and(
          eq(schema.timetableEntries.classId, student.classId),
          eq(schema.timetableEntries.sectionId, student.sectionId),
          eq(schema.timetableEntries.academicYearId, student.academicYearId),
        ),
      )
      .orderBy(schema.timetableEntries.dayOfWeek, schema.timeSlots.displayOrder, schema.timeSlots.startTime);
  }

  /** A teacher's own schedule. Admins can pass any teacherId. */
  async getForTeacher(teacherId: string | undefined, academicYearId: string, user: AuthenticatedUser) {
    const isAdmin = user.role === "SUPER_ADMIN" || user.role === "ADMIN";
    const target = user.role === "TEACHER" ? user.profileId : isAdmin ? teacherId : undefined;
    if (!target) throw new ForbiddenException();
    if (user.role === "TEACHER" && teacherId && teacherId !== user.profileId) throw new ForbiddenException();
    return this.selectEntries()
      .where(and(eq(schema.timetableEntries.teacherId, target), eq(schema.timetableEntries.academicYearId, academicYearId)))
      .orderBy(schema.timetableEntries.dayOfWeek, schema.timeSlots.displayOrder, schema.timeSlots.startTime);
  }
}
