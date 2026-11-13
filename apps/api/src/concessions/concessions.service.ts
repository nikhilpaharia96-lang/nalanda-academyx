import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db, schema } from "@nalanda/database";
import { AuditService } from "../common/audit.service";
import { OwnershipService } from "../common/ownership.service";
import { toFriendlyConflictError } from "../common/db-errors";
import type { AuthenticatedUser } from "../common/types/authenticated-user";

import { roundMoney } from "../common/money";
export { roundMoney };

export interface DiscountItem { concessionId: string; name: string; discountAmount: number }
export interface Quote { originalAmount: number; discount: number; net: number; items: DiscountItem[] }

@Injectable()
export class ConcessionsService {
  constructor(
    private readonly auditService: AuditService,
    private readonly ownershipService: OwnershipService,
  ) {}

  // --- Schemes ---------------------------------------------------------------------------------
  list() {
    return db.select().from(schema.concessions).orderBy(schema.concessions.name);
  }

  async create(dto: { name: string; type: string; value: number; feeType?: string; description?: string }, actorId: string) {
    try {
      const [row] = await db.insert(schema.concessions).values(dto).returning();
      await this.auditService.log({ userId: actorId, action: "CONCESSION_CREATE", entity: "Concession", entityId: row.id });
      return row;
    } catch (err) {
      throw toFriendlyConflictError(err, "name");
    }
  }

  /** Changing the value only affects fees generated from now on; discounts already given stay as recorded. */
  async update(id: string, dto: Partial<{ name: string; value: number; feeType: string | null; description: string; active: boolean }>, actorId: string) {
    const [existing] = await db.select().from(schema.concessions).where(eq(schema.concessions.id, id));
    if (!existing) throw new NotFoundException("Concession not found");
    if (dto.value !== undefined && existing.type === "PERCENT" && dto.value > 100) throw new BadRequestException("A percentage cannot exceed 100");
    try {
      const [row] = await db.update(schema.concessions).set({ ...dto, updatedAt: new Date().toISOString() }).where(eq(schema.concessions.id, id)).returning();
      await this.auditService.log({ userId: actorId, action: "CONCESSION_UPDATE", entity: "Concession", entityId: id });
      return row;
    } catch (err) {
      throw toFriendlyConflictError(err, "name");
    }
  }

  // --- The discount calculation (used when fees are generated) -------------------------------------
  /**
   * What a fee of `amount` and `feeType` costs this student in `academicYearId`.
   * Every active, non-revoked grant whose scheme is active and matches the fee type applies, in the order
   * granted. Percentages are taken on the original amount, flat amounts as given, and the total discount can
   * never exceed the fee (so a fee never goes negative).
   */
  async quote(studentId: string, academicYearId: string, feeType: string, amount: number): Promise<Quote> {
    const grants = await db
      .select({ c: schema.concessions, grantedAt: schema.studentConcessions.createdAt })
      .from(schema.studentConcessions)
      .innerJoin(schema.concessions, eq(schema.concessions.id, schema.studentConcessions.concessionId))
      .where(
        and(
          eq(schema.studentConcessions.studentId, studentId),
          eq(schema.studentConcessions.academicYearId, academicYearId),
          isNull(schema.studentConcessions.revokedAt),
          eq(schema.concessions.active, true),
        ),
      )
      .orderBy(asc(schema.studentConcessions.createdAt));

    let remaining = roundMoney(amount);
    const items: DiscountItem[] = [];
    for (const { c } of grants) {
      if (c.feeType && c.feeType !== feeType) continue;
      const raw = c.type === "PERCENT" ? (amount * c.value) / 100 : c.value;
      const d = roundMoney(Math.min(raw, remaining));
      if (d <= 0) continue;
      items.push({ concessionId: c.id, name: c.name, discountAmount: d });
      remaining = roundMoney(remaining - d);
    }
    const discount = roundMoney(items.reduce((s, i) => s + i.discountAmount, 0));
    return { originalAmount: roundMoney(amount), discount, net: roundMoney(amount - discount), items };
  }

  // --- Grants ------------------------------------------------------------------------------------
  async grant(dto: { studentId: string; concessionId: string; academicYearId: string; reason: string; applyToExisting?: boolean }, actorId: string) {
    const [student] = await db.select().from(schema.students).where(eq(schema.students.id, dto.studentId));
    if (!student) throw new NotFoundException("Student not found");
    const [scheme] = await db.select().from(schema.concessions).where(eq(schema.concessions.id, dto.concessionId));
    if (!scheme || !scheme.active) throw new NotFoundException("Concession not found or inactive");
    const [year] = await db.select().from(schema.academicYears).where(eq(schema.academicYears.id, dto.academicYearId));
    if (!year) throw new NotFoundException("Academic year not found");

    const [dup] = await db
      .select()
      .from(schema.studentConcessions)
      .where(
        and(
          eq(schema.studentConcessions.studentId, dto.studentId),
          eq(schema.studentConcessions.concessionId, dto.concessionId),
          eq(schema.studentConcessions.academicYearId, dto.academicYearId),
          isNull(schema.studentConcessions.revokedAt),
        ),
      );
    if (dup) throw new ConflictException("This student already has this concession for that academic year");

    const [grant] = await db
      .insert(schema.studentConcessions)
      .values({ studentId: dto.studentId, concessionId: dto.concessionId, academicYearId: dto.academicYearId, reason: dto.reason.trim(), grantedByUserId: actorId })
      .returning();
    await this.auditService.log({ userId: actorId, action: "CONCESSION_GRANT", entity: "StudentConcession", entityId: grant.id, description: `${scheme.name} -> student ${dto.studentId}` });

    const applied = dto.applyToExisting ? await this.applyToExistingFees(dto.studentId, dto.academicYearId, actorId) : { applied: 0, skipped: 0 };
    return { grant, ...applied };
  }

  /**
   * Discounts fees that were generated before the concession existed. Only fees that are still PENDING with
   * nothing paid and no earlier concession are touched; partly paid, paid, waived or already-discounted fees
   * are left exactly as they are and counted in `skipped`.
   */
  private async applyToExistingFees(studentId: string, academicYearId: string, actorId: string) {
    const fees = await db
      .select({ fee: schema.studentFees, feeType: schema.feeStructures.feeType })
      .from(schema.studentFees)
      .innerJoin(schema.feeStructures, eq(schema.feeStructures.id, schema.studentFees.feeStructureId))
      .where(and(eq(schema.studentFees.studentId, studentId), eq(schema.studentFees.academicYearId, academicYearId)));

    const already = fees.length
      ? await db.select({ id: schema.studentFeeConcessions.studentFeeId }).from(schema.studentFeeConcessions).where(inArray(schema.studentFeeConcessions.studentFeeId, fees.map((f) => f.fee.id)))
      : [];
    const hasDiscount = new Set(already.map((a) => a.id));

    let applied = 0, skipped = 0;
    for (const { fee, feeType } of fees) {
      if (fee.status !== "PENDING" || fee.paidAmount > 0 || hasDiscount.has(fee.id)) { if (fee.status !== "PAID" && fee.status !== "WAIVED" && fee.status !== "CANCELLED") skipped++; continue; }
      const q = await this.quote(studentId, academicYearId, feeType, fee.amount);
      if (q.discount <= 0) continue;

      // Conditional update: only succeeds if the fee is still untouched, so a payment landing mid-way is never altered.
      const now = new Date().toISOString();
      const [updated] = await db
        .update(schema.studentFees)
        .set({
          amount: q.net,
          updatedAt: now,
          ...(q.net === 0 ? { status: "WAIVED", waivedAt: now, waivedReason: `Fee concession: ${q.items.map((i) => i.name).join(", ")}` } : {}),
        })
        .where(and(eq(schema.studentFees.id, fee.id), eq(schema.studentFees.status, "PENDING"), eq(schema.studentFees.paidAmount, 0), eq(schema.studentFees.amount, fee.amount)))
        .returning();
      if (!updated) { skipped++; continue; }
      try {
        await this.recordApplied(fee.id, q);
        applied++;
      } catch (err) {
        await db.update(schema.studentFees).set({ amount: fee.amount, status: "PENDING", waivedAt: null, waivedReason: null }).where(eq(schema.studentFees.id, fee.id));
        throw err;
      }
    }
    if (applied > 0) await this.auditService.log({ userId: actorId, action: "CONCESSION_APPLY_EXISTING", entity: "Student", entityId: studentId, description: `${applied} existing fee(s) discounted` });
    return { applied, skipped };
  }

  /** Records what was discounted on a fee. Called right after a fee is created/updated with the net amount. */
  async recordApplied(studentFeeId: string, q: Quote) {
    if (q.items.length === 0) return;
    await db.insert(schema.studentFeeConcessions).values(
      q.items.map((i) => ({ studentFeeId, concessionId: i.concessionId, originalAmount: q.originalAmount, discountAmount: i.discountAmount })),
    );
  }

  /** Stops the concession for fees generated from now on. Discounts already given are kept. */
  async revoke(grantId: string, actorId: string) {
    const [row] = await db
      .update(schema.studentConcessions)
      .set({ revokedAt: new Date().toISOString() })
      .where(and(eq(schema.studentConcessions.id, grantId), isNull(schema.studentConcessions.revokedAt)))
      .returning();
    if (!row) throw new NotFoundException("Active grant not found");
    await this.auditService.log({ userId: actorId, action: "CONCESSION_REVOKE", entity: "StudentConcession", entityId: grantId });
    return row;
  }

  /** A student's grants plus how much has actually been discounted so far. Students/parents may view their own. */
  async forStudent(studentId: string, user: AuthenticatedUser) {
    await this.ownershipService.assertCanAccessStudent(studentId, user);
    if (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN" && user.role !== "STUDENT" && user.role !== "PARENT") throw new ForbiddenException();
    const grants = await db
      .select({
        id: schema.studentConcessions.id, reason: schema.studentConcessions.reason, revokedAt: schema.studentConcessions.revokedAt,
        createdAt: schema.studentConcessions.createdAt, academicYearId: schema.studentConcessions.academicYearId,
        concessionId: schema.concessions.id, name: schema.concessions.name, type: schema.concessions.type, value: schema.concessions.value, feeType: schema.concessions.feeType,
      })
      .from(schema.studentConcessions)
      .innerJoin(schema.concessions, eq(schema.concessions.id, schema.studentConcessions.concessionId))
      .where(eq(schema.studentConcessions.studentId, studentId))
      .orderBy(schema.studentConcessions.createdAt);
    const [{ total }] = await db
      .select({ total: sql<number>`coalesce(sum(${schema.studentFeeConcessions.discountAmount}), 0)` })
      .from(schema.studentFeeConcessions)
      .innerJoin(schema.studentFees, eq(schema.studentFees.id, schema.studentFeeConcessions.studentFeeId))
      .where(eq(schema.studentFees.studentId, studentId));
    return { grants, totalDiscounted: roundMoney(Number(total)) };
  }

  /** Admin report: per scheme, how many fees were discounted and by how much. */
  async report(academicYearId?: string) {
    const rows = await db
      .select({
        concessionId: schema.concessions.id, name: schema.concessions.name, type: schema.concessions.type, value: schema.concessions.value,
        fees: sql<number>`count(*)`, students: sql<number>`count(distinct ${schema.studentFees.studentId})`,
        total: sql<number>`coalesce(sum(${schema.studentFeeConcessions.discountAmount}), 0)`,
      })
      .from(schema.studentFeeConcessions)
      .innerJoin(schema.concessions, eq(schema.concessions.id, schema.studentFeeConcessions.concessionId))
      .innerJoin(schema.studentFees, eq(schema.studentFees.id, schema.studentFeeConcessions.studentFeeId))
      .where(academicYearId ? eq(schema.studentFees.academicYearId, academicYearId) : undefined)
      .groupBy(schema.concessions.id, schema.concessions.name, schema.concessions.type, schema.concessions.value);
    const items = rows.map((r) => ({ ...r, fees: Number(r.fees), students: Number(r.students), total: roundMoney(Number(r.total)) }));
    return { items, grandTotal: roundMoney(items.reduce((s, r) => s + r.total, 0)) };
  }
}
