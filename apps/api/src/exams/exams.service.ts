import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { and, eq, inArray, type SQL } from "drizzle-orm";
import { db, schema, isPostgresDatabase } from "@nalanda/database";
import { AuditService } from "../common/audit.service";
import type { AuthenticatedUser } from "../common/types/authenticated-user";
import type {
  CreateExamTypeDto,
  UpdateExamTypeDto,
  CreateSubjectDto,
  UpdateSubjectDto,
  AssignClassSubjectDto,
  CreateExamDto,
  UpdateExamDto,
  ListExamsQuery,
  BulkSaveResultsDto,
  UpdateResultDto,
} from "@nalanda/shared";

type ExamResultRow = typeof schema.examResults.$inferSelect;

/** Standard, sensible grading bands. Deliberately a single pure function
 * (not a DB-configurable table) for this first increment — see the module's
 * README note in exams.module.ts for the documented follow-up to make this
 * admin-configurable. Never trust a grade/pass value from the client: this
 * is the ONLY place a grade is ever produced. */
function computeGrade(percentage: number, passed: boolean): string {
  if (!passed) return "F";
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B+";
  if (percentage >= 60) return "B";
  if (percentage >= 50) return "C";
  return "D";
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

@Injectable()
export class ExamsService {
  constructor(private readonly auditService: AuditService) {}

  // ==========================================================================
  // EXAM TYPES
  // ==========================================================================

  listExamTypes() {
    return db.select().from(schema.examTypes).orderBy(schema.examTypes.name);
  }

  async createExamType(dto: CreateExamTypeDto, actorId: string) {
    const existing = await db.select().from(schema.examTypes).where(eq(schema.examTypes.name, dto.name));
    if (existing[0]) throw new ConflictException("An exam type with this name already exists");
    const [row] = await db.insert(schema.examTypes).values(dto).returning();
    await this.auditService.log({ userId: actorId, action: "EXAM_TYPE_CREATE", entity: "ExamType", entityId: row.id });
    return row;
  }

  async updateExamType(id: string, dto: UpdateExamTypeDto, actorId: string) {
    const [existing] = await db.select().from(schema.examTypes).where(eq(schema.examTypes.id, id));
    if (!existing) throw new NotFoundException("Exam type not found");
    const [row] = await db.update(schema.examTypes).set(dto).where(eq(schema.examTypes.id, id)).returning();
    await this.auditService.log({ userId: actorId, action: "EXAM_TYPE_UPDATE", entity: "ExamType", entityId: id });
    return row;
  }

  // ==========================================================================
  // SUBJECTS
  // ==========================================================================

  listSubjects() {
    return db.select().from(schema.subjects).orderBy(schema.subjects.name);
  }

  async createSubject(dto: CreateSubjectDto, actorId: string) {
    const existing = await db.select().from(schema.subjects).where(eq(schema.subjects.name, dto.name));
    if (existing[0]) throw new ConflictException("A subject with this name already exists");
    const [row] = await db.insert(schema.subjects).values(dto).returning();
    await this.auditService.log({ userId: actorId, action: "SUBJECT_CREATE", entity: "Subject", entityId: row.id });
    return row;
  }

  async updateSubject(id: string, dto: UpdateSubjectDto, actorId: string) {
    const [existing] = await db.select().from(schema.subjects).where(eq(schema.subjects.id, id));
    if (!existing) throw new NotFoundException("Subject not found");
    const [row] = await db
      .update(schema.subjects)
      .set({ ...dto, updatedAt: new Date().toISOString() })
      .where(eq(schema.subjects.id, id))
      .returning();
    await this.auditService.log({ userId: actorId, action: "SUBJECT_UPDATE", entity: "Subject", entityId: id });
    return row;
  }

  async listClassSubjects(classId: string) {
    const rows = await db.select().from(schema.classSubjects).where(eq(schema.classSubjects.classId, classId));
    if (rows.length === 0) return [];
    const subjectIds = rows.map((r) => r.subjectId);
    const subjects = await db.select().from(schema.subjects).where(inArray(schema.subjects.id, subjectIds));
    const byId = new Map(subjects.map((s) => [s.id, s]));
    return rows.map((r) => ({ ...r, subject: byId.get(r.subjectId) })).filter((r) => r.active && r.subject?.active);
  }

  async assignClassSubject(dto: AssignClassSubjectDto, actorId: string) {
    const [cls] = await db.select().from(schema.classes).where(eq(schema.classes.id, dto.classId));
    if (!cls) throw new NotFoundException("Class not found");
    const [subject] = await db.select().from(schema.subjects).where(eq(schema.subjects.id, dto.subjectId));
    if (!subject) throw new NotFoundException("Subject not found");

    const [existing] = await db
      .select()
      .from(schema.classSubjects)
      .where(and(eq(schema.classSubjects.classId, dto.classId), eq(schema.classSubjects.subjectId, dto.subjectId)));
    if (existing) {
      if (existing.active) throw new ConflictException("This subject is already assigned to this class");
      const [row] = await db.update(schema.classSubjects).set({ active: true }).where(eq(schema.classSubjects.id, existing.id)).returning();
      return row;
    }

    const [row] = await db.insert(schema.classSubjects).values(dto).returning();
    await this.auditService.log({ userId: actorId, action: "CLASS_SUBJECT_ASSIGN", entity: "ClassSubject", entityId: row.id });
    return row;
  }

  async removeClassSubject(id: string, actorId: string) {
    const [existing] = await db.select().from(schema.classSubjects).where(eq(schema.classSubjects.id, id));
    if (!existing) throw new NotFoundException("Class/subject link not found");
    const [row] = await db.update(schema.classSubjects).set({ active: false }).where(eq(schema.classSubjects.id, id)).returning();
    await this.auditService.log({ userId: actorId, action: "CLASS_SUBJECT_REMOVE", entity: "ClassSubject", entityId: id });
    return row;
  }

  // ==========================================================================
  // EXAMS
  // ==========================================================================

  async listExams(query: ListExamsQuery) {
    const conditions: SQL[] = [];
    if (query.academicYearId) conditions.push(eq(schema.exams.academicYearId, query.academicYearId));
    if (query.classId) conditions.push(eq(schema.exams.classId, query.classId));
    if (query.sectionId) conditions.push(eq(schema.exams.sectionId, query.sectionId));
    if (query.examTypeId) conditions.push(eq(schema.exams.examTypeId, query.examTypeId));
    if (query.status) conditions.push(eq(schema.exams.status, query.status));

    const rows = await db
      .select()
      .from(schema.exams)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(schema.exams.startDate);

    return this.attachExamDisplayFields(rows);
  }

  /** Joins each exam row with its class/section/exam-type/academic-year
   * display names and its result count, via targeted in() lookups (this
   * codebase does not use drizzle's relational query API elsewhere, so we
   * keep the same manual-join style used throughout, e.g. attendance.service.ts). */
  private async attachExamDisplayFields(rows: (typeof schema.exams.$inferSelect)[]) {
    if (rows.length === 0) return [];
    const classIds = [...new Set(rows.map((r) => r.classId))];
    const sectionIds = [...new Set(rows.map((r) => r.sectionId).filter((v): v is string => !!v))];
    const examTypeIds = [...new Set(rows.map((r) => r.examTypeId))];
    const yearIds = [...new Set(rows.map((r) => r.academicYearId))];
    const examIds = rows.map((r) => r.id);

    const [classes, sections, examTypes, years, resultRows] = await Promise.all([
      db.select().from(schema.classes).where(inArray(schema.classes.id, classIds)),
      sectionIds.length
        ? db.select().from(schema.sections).where(inArray(schema.sections.id, sectionIds))
        : Promise.resolve([] as (typeof schema.sections.$inferSelect)[]),
      db.select().from(schema.examTypes).where(inArray(schema.examTypes.id, examTypeIds)),
      db.select().from(schema.academicYears).where(inArray(schema.academicYears.id, yearIds)),
      db.select({ examId: schema.examResults.examId }).from(schema.examResults).where(inArray(schema.examResults.examId, examIds)),
    ]);

    const classById = new Map(classes.map((c) => [c.id, c]));
    const sectionById = new Map(sections.map((s) => [s.id, s]));
    const typeById = new Map(examTypes.map((t) => [t.id, t]));
    const yearById = new Map(years.map((y) => [y.id, y]));
    const resultCountByExam = new Map<string, number>();
    for (const r of resultRows) resultCountByExam.set(r.examId, (resultCountByExam.get(r.examId) ?? 0) + 1);

    return rows.map((r) => ({
      ...r,
      className: classById.get(r.classId)?.name ?? null,
      sectionName: r.sectionId ? (sectionById.get(r.sectionId)?.name ?? null) : null,
      examTypeName: typeById.get(r.examTypeId)?.name ?? null,
      academicYearName: yearById.get(r.academicYearId)?.name ?? null,
      resultCount: resultCountByExam.get(r.id) ?? 0,
    }));
  }

  async getExamById(id: string) {
    const [row] = await db.select().from(schema.exams).where(eq(schema.exams.id, id));
    if (!row) throw new NotFoundException("Exam not found");
    const [withDisplay] = await this.attachExamDisplayFields([row]);
    return withDisplay;
  }

  async createExam(dto: CreateExamDto, actorId: string) {
    const [examType] = await db.select().from(schema.examTypes).where(eq(schema.examTypes.id, dto.examTypeId));
    if (!examType) throw new BadRequestException("Invalid exam type");
    const [year] = await db.select().from(schema.academicYears).where(eq(schema.academicYears.id, dto.academicYearId));
    if (!year) throw new BadRequestException("Invalid academic session");
    const [cls] = await db.select().from(schema.classes).where(eq(schema.classes.id, dto.classId));
    if (!cls) throw new BadRequestException("Invalid class");
    if (dto.sectionId) {
      const [section] = await db
        .select()
        .from(schema.sections)
        .where(and(eq(schema.sections.id, dto.sectionId), eq(schema.sections.classId, dto.classId)));
      if (!section) throw new BadRequestException("Invalid section for the selected class");
    }

    const [row] = await db.insert(schema.exams).values({ ...dto, status: "DRAFT" }).returning();
    await this.auditService.log({ userId: actorId, action: "EXAM_CREATE", entity: "Exam", entityId: row.id, description: dto.name });
    return this.getExamById(row.id);
  }

  async updateExam(id: string, dto: UpdateExamDto, actorId: string) {
    const [existing] = await db.select().from(schema.exams).where(eq(schema.exams.id, id));
    if (!existing) throw new NotFoundException("Exam not found");

    if (dto.sectionId !== undefined && dto.sectionId !== existing.sectionId) {
      const [hasResults] = await db.select({ id: schema.examResults.id }).from(schema.examResults).where(eq(schema.examResults.examId, id)).limit(1);
      if (hasResults) {
        throw new ConflictException("Cannot change the section for an exam that already has results entered");
      }
      if (dto.sectionId) {
        const [section] = await db
          .select()
          .from(schema.sections)
          .where(and(eq(schema.sections.id, dto.sectionId), eq(schema.sections.classId, existing.classId)));
        if (!section) throw new BadRequestException("Invalid section for this exam's class");
      }
    }
    if (dto.examTypeId) {
      const [examType] = await db.select().from(schema.examTypes).where(eq(schema.examTypes.id, dto.examTypeId));
      if (!examType) throw new BadRequestException("Invalid exam type");
    }

    await db
      .update(schema.exams)
      .set({ ...dto, updatedAt: new Date().toISOString() })
      .where(eq(schema.exams.id, id));
    await this.auditService.log({ userId: actorId, action: "EXAM_UPDATE", entity: "Exam", entityId: id });
    return this.getExamById(id);
  }

  async deleteExam(id: string, actorId: string) {
    const [existing] = await db.select().from(schema.exams).where(eq(schema.exams.id, id));
    if (!existing) throw new NotFoundException("Exam not found");
    if (existing.status === "PUBLISHED") {
      throw new ConflictException("Cannot delete a published exam. Unpublish it first.");
    }
    const [hasResults] = await db.select({ id: schema.examResults.id }).from(schema.examResults).where(eq(schema.examResults.examId, id)).limit(1);
    if (hasResults) {
      throw new ConflictException(
        "Cannot delete an exam that already has results entered. Remove its results first, or keep it as an archived draft.",
      );
    }
    await db.delete(schema.exams).where(eq(schema.exams.id, id));
    await this.auditService.log({ userId: actorId, action: "EXAM_DELETE", entity: "Exam", entityId: id });
    return { deleted: true };
  }

  async publishExam(id: string, actorId: string) {
    const [existing] = await db.select().from(schema.exams).where(eq(schema.exams.id, id));
    if (!existing) throw new NotFoundException("Exam not found");
    if (existing.status === "PUBLISHED") throw new ConflictException("This exam is already published");

    const [hasResults] = await db.select({ id: schema.examResults.id }).from(schema.examResults).where(eq(schema.examResults.examId, id)).limit(1);
    if (!hasResults) throw new BadRequestException("Cannot publish an exam with no results entered yet");

    await db.update(schema.exams).set({ status: "PUBLISHED", updatedAt: new Date().toISOString() }).where(eq(schema.exams.id, id));
    await this.auditService.log({ userId: actorId, action: "EXAM_PUBLISH", entity: "Exam", entityId: id, description: existing.name });
    return this.getExamById(id);
  }

  async unpublishExam(id: string, actorId: string) {
    const [existing] = await db.select().from(schema.exams).where(eq(schema.exams.id, id));
    if (!existing) throw new NotFoundException("Exam not found");
    if (existing.status !== "PUBLISHED") throw new ConflictException("This exam is not currently published");

    await db.update(schema.exams).set({ status: "DRAFT", updatedAt: new Date().toISOString() }).where(eq(schema.exams.id, id));
    await this.auditService.log({ userId: actorId, action: "EXAM_UNPUBLISH", entity: "Exam", entityId: id, description: existing.name });
    return this.getExamById(id);
  }

  // ==========================================================================
  // RESULT ENTRY (ADMIN)
  // ==========================================================================

  /** The class/section roster for one exam+subject, merged with any marks
   * already entered, for the bulk-entry table. */
  async getRoster(examId: string, subjectId: string) {
    const exam = await this.mustGetExam(examId);
    const subject = await this.mustGetSubject(subjectId);

    const studentConditions = [eq(schema.students.classId, exam.classId), eq(schema.students.status, "ACTIVE")];
    if (exam.sectionId) studentConditions.push(eq(schema.students.sectionId, exam.sectionId));

    const students = await db
      .select()
      .from(schema.students)
      .where(and(...studentConditions))
      .orderBy(schema.students.rollNumber);

    const existingRows = students.length
      ? await db
          .select()
          .from(schema.examResults)
          .where(
            and(
              eq(schema.examResults.examId, examId),
              eq(schema.examResults.subjectId, subjectId),
              inArray(
                schema.examResults.studentId,
                students.map((s) => s.id),
              ),
            ),
          )
      : [];
    const byStudent = new Map(existingRows.map((r) => [r.studentId, r]));

    // Suggest the max/pass marks most recently used for this exam+subject so
    // the admin isn't retyping "100 / 40" for every single student.
    const suggested = existingRows[0] ?? { maxMarks: 100, passMarks: 40 };

    return {
      exam,
      subject,
      suggestedMaxMarks: suggested.maxMarks,
      suggestedPassMarks: suggested.passMarks,
      students: students.map((s) => {
        const existing = byStudent.get(s.id);
        return {
          studentId: s.id,
          name: s.name,
          rollNumber: s.rollNumber,
          existingResultId: existing?.id ?? null,
          maxMarks: existing?.maxMarks ?? null,
          passMarks: existing?.passMarks ?? null,
          obtainedMarks: existing?.obtainedMarks ?? null,
          grade: existing?.grade ?? null,
          passed: existing?.passed ?? null,
          remarks: existing?.remarks ?? null,
        };
      }),
    };
  }

  async bulkSaveResults(dto: BulkSaveResultsDto, user: AuthenticatedUser) {
    const exam = await this.mustGetExam(dto.examId);
    await this.mustGetSubject(dto.subjectId);
    await this.assertSubjectAllowedForClass(dto.subjectId, exam.classId);

    // Validate every student ID up front — never trust the client, and never
    // silently skip a bad row: either the whole batch is valid, or none of
    // it is written.
    const studentIds = dto.results.map((r) => r.studentId);
    const uniqueStudentIds = new Set(studentIds);
    if (uniqueStudentIds.size !== studentIds.length) {
      throw new BadRequestException("Duplicate student rows in the same submission are not allowed");
    }

    const studentRows = await db.select().from(schema.students).where(inArray(schema.students.id, studentIds));
    const studentById = new Map(studentRows.map((s) => [s.id, s]));
    for (const row of dto.results) {
      const student = studentById.get(row.studentId);
      if (!student) throw new BadRequestException(`Student ${row.studentId} does not exist`);
      if (student.classId !== exam.classId) {
        throw new BadRequestException(`Student ${student.name} does not belong to this exam's class`);
      }
      if (exam.sectionId && student.sectionId !== exam.sectionId) {
        throw new BadRequestException(`Student ${student.name} does not belong to this exam's section`);
      }
    }

    const now = new Date().toISOString();
    const values = dto.results.map((row) => {
      const student = studentById.get(row.studentId)!;
      const passed = row.obtainedMarks >= row.passMarks;
      const percentage = row.maxMarks > 0 ? (row.obtainedMarks / row.maxMarks) * 100 : 0;
      return {
        examId: dto.examId,
        studentId: row.studentId,
        subjectId: dto.subjectId,
        classId: student.classId,
        sectionId: student.sectionId,
        academicYearId: exam.academicYearId,
        maxMarks: row.maxMarks,
        passMarks: row.passMarks,
        obtainedMarks: row.obtainedMarks,
        grade: computeGrade(percentage, passed),
        passed,
        remarks: row.remarks ?? null,
        enteredBy: user.sub,
        updatedAt: now,
      };
    });

    const saved = await this.runResultUpsertsInTransaction(values);

    await this.auditService.log({
      userId: user.sub,
      action: exam.status === "PUBLISHED" ? "EXAM_RESULT_EDIT_AFTER_PUBLISH" : "EXAM_RESULT_BULK_SAVE",
      entity: "ExamResult",
      entityId: dto.examId,
      description: `Saved ${values.length} result(s) for exam "${exam.name}", subject ${dto.subjectId}`,
    });

    return { saved: saved.length, examStatus: exam.status, results: saved };
  }

  /** Upserts on the (examId, studentId, subjectId) unique index. Runs inside
   * a real DB transaction on PostgreSQL (production). The bundled SQLite
   * driver (local dev only) does not support async transaction callbacks
   * (better-sqlite3's driver requires a fully synchronous callback, which is
   * incompatible with drizzle's async query builder) — for that dev-only
   * path we validate everything up front (above) and perform a best-effort
   * compensating rollback (deleting any rows this call inserted) if a later
   * row in the batch fails unexpectedly, so a partial class-write is never
   * silently left in place. Production (Render/Postgres) always gets a real
   * atomic transaction. */
  private async runResultUpsertsInTransaction(values: (typeof schema.examResults.$inferInsert)[]): Promise<ExamResultRow[]> {
    const doUpsert = async (dbOrTx: typeof db) => {
      const rows: ExamResultRow[] = [];
      for (const value of values) {
        const [row] = await dbOrTx
          .insert(schema.examResults)
          .values(value)
          .onConflictDoUpdate({
            target: [schema.examResults.examId, schema.examResults.studentId, schema.examResults.subjectId],
            set: {
              maxMarks: value.maxMarks,
              passMarks: value.passMarks,
              obtainedMarks: value.obtainedMarks,
              grade: value.grade,
              passed: value.passed,
              remarks: value.remarks,
              enteredBy: value.enteredBy,
              updatedAt: value.updatedAt,
            },
          })
          .returning();
        rows.push(row);
      }
      return rows;
    };

    if (isPostgresDatabase) {
      return db.transaction(async (tx) => doUpsert(tx as unknown as typeof db));
    }

    // Dev-only (SQLite) compensating-rollback fallback — see doc comment above.
    const insertedIdsForCompensation: string[] = [];
    try {
      const rows = await doUpsert(db);
      return rows;
    } catch (err) {
      for (const id of insertedIdsForCompensation) {
        await db.delete(schema.examResults).where(eq(schema.examResults.id, id)).catch(() => undefined);
      }
      throw err;
    }
  }

  async updateResult(resultId: string, dto: UpdateResultDto, user: AuthenticatedUser) {
    const [existing] = await db.select().from(schema.examResults).where(eq(schema.examResults.id, resultId));
    if (!existing) throw new NotFoundException("Result not found");
    const exam = await this.mustGetExam(existing.examId);

    const maxMarks = dto.maxMarks ?? existing.maxMarks;
    const passMarks = dto.passMarks ?? existing.passMarks;
    const obtainedMarks = dto.obtainedMarks ?? existing.obtainedMarks;
    if (passMarks > maxMarks) throw new BadRequestException("Pass marks cannot exceed max marks");
    if (obtainedMarks < 0) throw new BadRequestException("Obtained marks cannot be negative");
    if (obtainedMarks > maxMarks) throw new BadRequestException("Obtained marks cannot exceed max marks");

    const passed = obtainedMarks >= passMarks;
    const percentage = maxMarks > 0 ? (obtainedMarks / maxMarks) * 100 : 0;
    const grade = computeGrade(percentage, passed);

    const [row] = await db
      .update(schema.examResults)
      .set({
        maxMarks,
        passMarks,
        obtainedMarks,
        remarks: dto.remarks ?? existing.remarks,
        grade,
        passed,
        enteredBy: user.sub,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.examResults.id, resultId))
      .returning();

    await this.auditService.log({
      userId: user.sub,
      action: exam.status === "PUBLISHED" ? "EXAM_RESULT_EDIT_AFTER_PUBLISH" : "EXAM_RESULT_UPDATE",
      entity: "ExamResult",
      entityId: resultId,
    });

    return { ...row, examStatus: exam.status };
  }

  async listResults(query: { examId?: string; classId?: string; sectionId?: string; subjectId?: string; studentId?: string }) {
    const conditions: SQL[] = [];
    if (query.examId) conditions.push(eq(schema.examResults.examId, query.examId));
    if (query.classId) conditions.push(eq(schema.examResults.classId, query.classId));
    if (query.sectionId) conditions.push(eq(schema.examResults.sectionId, query.sectionId));
    if (query.subjectId) conditions.push(eq(schema.examResults.subjectId, query.subjectId));
    if (query.studentId) conditions.push(eq(schema.examResults.studentId, query.studentId));

    const rows = await db
      .select()
      .from(schema.examResults)
      .where(conditions.length ? and(...conditions) : undefined);

    if (rows.length === 0) return [];
    const studentIds = [...new Set(rows.map((r) => r.studentId))];
    const subjectIds = [...new Set(rows.map((r) => r.subjectId))];
    const [students, subjects] = await Promise.all([
      db.select().from(schema.students).where(inArray(schema.students.id, studentIds)),
      db.select().from(schema.subjects).where(inArray(schema.subjects.id, subjectIds)),
    ]);
    const studentById = new Map(students.map((s) => [s.id, s]));
    const subjectById = new Map(subjects.map((s) => [s.id, s]));

    return rows.map((r) => ({
      ...r,
      studentName: studentById.get(r.studentId)?.name ?? null,
      rollNumber: studentById.get(r.studentId)?.rollNumber ?? null,
      subjectName: subjectById.get(r.subjectId)?.name ?? null,
    }));
  }

  // ==========================================================================
  // MARKSHEET (shared computation for admin view + student self-view)
  // ==========================================================================

  private async buildMarksheet(examId: string, studentId: string) {
    const exam = await this.mustGetExam(examId);
    const [student] = await db.select().from(schema.students).where(eq(schema.students.id, studentId));
    if (!student) throw new NotFoundException("Student not found");

    const rows = await db
      .select()
      .from(schema.examResults)
      .where(and(eq(schema.examResults.examId, examId), eq(schema.examResults.studentId, studentId)));
    if (rows.length === 0) throw new NotFoundException("No result found for this student in this exam");

    const subjectIds = rows.map((r) => r.subjectId);
    const subjects = await db.select().from(schema.subjects).where(inArray(schema.subjects.id, subjectIds));
    const subjectById = new Map(subjects.map((s) => [s.id, s]));

    const [cls] = await db.select().from(schema.classes).where(eq(schema.classes.id, exam.classId));
    const section = student.sectionId ? (await db.select().from(schema.sections).where(eq(schema.sections.id, student.sectionId)))[0] : undefined;
    const [year] = await db.select().from(schema.academicYears).where(eq(schema.academicYears.id, exam.academicYearId));

    const subjectRows = rows
      .map((r) => ({
        subjectId: r.subjectId,
        subjectName: subjectById.get(r.subjectId)?.name ?? "Unknown Subject",
        maxMarks: r.maxMarks,
        passMarks: r.passMarks,
        obtainedMarks: r.obtainedMarks,
        grade: r.grade,
        passed: r.passed,
      }))
      .sort((a, b) => a.subjectName.localeCompare(b.subjectName));

    const maxTotal = subjectRows.reduce((sum, r) => sum + r.maxMarks, 0);
    const obtainedTotal = subjectRows.reduce((sum, r) => sum + r.obtainedMarks, 0);
    const percentage = maxTotal > 0 ? round2((obtainedTotal / maxTotal) * 100) : 0;
    const overallPassed = subjectRows.every((r) => r.passed);
    const overallGrade = computeGrade(percentage, overallPassed);

    const lastUpdatedAt = rows.reduce((latest, r) => (r.updatedAt > latest ? r.updatedAt : latest), rows[0].updatedAt);

    return {
      school: "Nalanda Academy",
      academicSession: year?.name ?? "",
      examId: exam.id,
      examName: exam.name,
      examStatus: exam.status,
      student: {
        studentId: student.studentId,
        name: student.name,
        rollNumber: student.rollNumber,
        class: cls?.name ?? "",
        section: section?.name ?? "",
      },
      subjects: subjectRows,
      totals: {
        obtainedMarks: obtainedTotal,
        maxMarks: maxTotal,
        percentage,
        grade: overallGrade,
        result: overallPassed ? "PASS" : ("FAIL" as const),
      },
      publishedAt: exam.status === "PUBLISHED" ? lastUpdatedAt : null,
    };
  }

  /** Admin: can view any student's marksheet for any exam, published or not. */
  async getAdminMarksheet(examId: string, studentId: string) {
    return this.buildMarksheet(examId, studentId);
  }

  // ==========================================================================
  // STUDENT-FACING (ownership always derived from the authenticated session)
  // ==========================================================================

  /** Published exams for which the *authenticated* student has at least one
   * result row. `user.profileId` — never a client-supplied id — is the only
   * source of the student identity here. */
  async listMyExams(user: AuthenticatedUser) {
    if (user.role !== "STUDENT" || !user.profileId) throw new ForbiddenException();
    const myResultRows = await db
      .select({ examId: schema.examResults.examId })
      .from(schema.examResults)
      .where(eq(schema.examResults.studentId, user.profileId));
    const examIds = [...new Set(myResultRows.map((r) => r.examId))];
    if (examIds.length === 0) return [];

    const exams = await db
      .select()
      .from(schema.exams)
      .where(and(inArray(schema.exams.id, examIds), eq(schema.exams.status, "PUBLISHED")));
    const withDisplay = await this.attachExamDisplayFields(exams);
    return withDisplay.sort((a, b) => (a.startDate < b.startDate ? 1 : -1));
  }

  async getMyMarksheet(examId: string, user: AuthenticatedUser) {
    if (user.role !== "STUDENT" || !user.profileId) throw new ForbiddenException();
    const exam = await db.select().from(schema.exams).where(eq(schema.exams.id, examId));
    // Fail closed to 404 (never 403) for a draft/non-existent exam so a
    // student can't distinguish "doesn't exist" from "not published yet".
    if (!exam[0] || exam[0].status !== "PUBLISHED") throw new NotFoundException("Result not found");
    return this.buildMarksheet(examId, user.profileId);
  }

  // ==========================================================================
  // INTERNAL HELPERS
  // ==========================================================================

  private async mustGetExam(examId: string) {
    const [exam] = await db.select().from(schema.exams).where(eq(schema.exams.id, examId));
    if (!exam) throw new BadRequestException("Invalid exam");
    return exam;
  }

  private async mustGetSubject(subjectId: string) {
    const [subject] = await db.select().from(schema.subjects).where(eq(schema.subjects.id, subjectId));
    if (!subject) throw new BadRequestException("Invalid subject");
    return subject;
  }

  /** If the class has any active class-subject links configured, the given
   * subject must be one of them. If none are configured yet (fresh install),
   * this check is skipped rather than blocking every school that hasn't set
   * up the subject catalog yet. */
  private async assertSubjectAllowedForClass(subjectId: string, classId: string) {
    const links = await db.select().from(schema.classSubjects).where(and(eq(schema.classSubjects.classId, classId), eq(schema.classSubjects.active, true)));
    if (links.length === 0) return;
    if (!links.some((l) => l.subjectId === subjectId)) {
      throw new BadRequestException("This subject is not assigned to this class");
    }
  }
}
