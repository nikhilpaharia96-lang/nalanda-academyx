import { Injectable, NotFoundException } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { db, schema } from "@nalanda/database";
import { AuditService } from "../common/audit.service";
import { OwnershipService } from "../common/ownership.service";
import type { AuthenticatedUser } from "../common/types/authenticated-user";

@Injectable()
export class ResultsService {
  constructor(
    private readonly auditService: AuditService,
    private readonly ownershipService: OwnershipService,
  ) {}

  /** Students/parents only ever see published years; admins see everything.
   * `user` is optional: this is a public read consumed by the marketing site
   * as well as authenticated portals. */
  async listYears(user?: AuthenticatedUser) {
    const rows = await db.select().from(schema.resultYears).orderBy(schema.resultYears.year);
    const isAdmin = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";
    return isAdmin ? rows : rows.filter((r) => r.published);
  }

  async getYear(year: number, user?: AuthenticatedUser) {
    const [row] = await db.select().from(schema.resultYears).where(eq(schema.resultYears.year, year));
    if (!row) throw new NotFoundException("Result year not found");
    const isAdmin = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";
    // Fail closed toward 404 (not 403) for unpublished years so an
    // unauthenticated visitor can't distinguish "doesn't exist" from
    // "not published yet".
    if (!row.published && !isAdmin) throw new NotFoundException("Result year not found");

    const students = await db.select().from(schema.studentResults).where(eq(schema.studentResults.resultYearId, row.id));
    return { ...row, topPerformers: students.filter((s) => s.achievement).slice(0, 20) };
  }

  async createYear(dto: { year: number; academicYearId?: string; totalStudents?: number; appeared?: number; passed?: number; passPercentage?: number; distinction?: number; starMarks?: number }, actorId: string) {
    const [row] = await db.insert(schema.resultYears).values(dto).returning();
    await this.auditService.log({ userId: actorId, action: "RESULT_YEAR_CREATE", entity: "ResultYear", entityId: row.id });
    return row;
  }

  async updateYear(id: string, dto: Partial<{ totalStudents: number; appeared: number; passed: number; passPercentage: number; distinction: number; starMarks: number; published: boolean }>, actorId: string) {
    const [existing] = await db.select().from(schema.resultYears).where(eq(schema.resultYears.id, id));
    if (!existing) throw new NotFoundException("Result year not found");
    const [row] = await db
      .update(schema.resultYears)
      .set({ ...dto, updatedAt: new Date().toISOString() })
      .where(eq(schema.resultYears.id, id))
      .returning();
    await this.auditService.log({
      userId: actorId,
      action: dto.published !== undefined ? (dto.published ? "RESULT_YEAR_PUBLISH" : "RESULT_YEAR_UNPUBLISH") : "RESULT_YEAR_UPDATE",
      entity: "ResultYear",
      entityId: id,
    });
    return row;
  }

  async addStudentResult(dto: { resultYearId: string; studentId?: string; studentName: string; percentage: number; grade?: string; achievement?: string }, actorId: string) {
    const [row] = await db.insert(schema.studentResults).values(dto).returning();
    await this.auditService.log({ userId: actorId, action: "STUDENT_RESULT_CREATE", entity: "StudentResult", entityId: row.id });
    return row;
  }

  /** Ownership-checked: a student/parent only sees this student's PUBLISHED results. */
  async getStudentResults(studentId: string, user: AuthenticatedUser) {
    await this.ownershipService.assertCanAccessStudent(studentId, user);
    const isAdmin = user.role === "SUPER_ADMIN" || user.role === "ADMIN";

    const rows = await db.select().from(schema.studentResults).where(eq(schema.studentResults.studentId, studentId));
    if (isAdmin) return rows;

    const results: (typeof schema.studentResults.$inferSelect)[] = [];
    for (const r of rows) {
      const [year] = await db.select().from(schema.resultYears).where(eq(schema.resultYears.id, r.resultYearId));
      if (year?.published) results.push(r);
    }
    return results;
  }
}
