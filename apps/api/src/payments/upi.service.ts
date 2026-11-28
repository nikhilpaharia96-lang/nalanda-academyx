import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { desc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@nalanda/database";
import { AuditService } from "../common/audit.service";
import { OwnershipService } from "../common/ownership.service";
import { PaymentsService } from "./payments.service";
import type { AuthenticatedUser } from "../common/types/authenticated-user";

const EPS = 0.01;
const OPEN = ["PENDING", "NEEDS_REVIEW"];

/** UTRs are bank reference numbers: letters/digits only, case-insensitive, no spaces. */
export function normalizeUtr(raw: string) {
  return raw.replace(/[\s-]/g, "").toUpperCase();
}
export function isValidUtr(utr: string) {
  return /^[A-Z0-9]{10,22}$/.test(utr);
}

export type MatchResult =
  | { matched: true; claimId: string; paymentId: string }
  | { matched: false; reason: "NO_CLAIM" | "NO_CREDIT" | "AMOUNT_MISMATCH" | "NEEDS_REVIEW" | "ALREADY_MATCHED"; message: string };

@Injectable()
export class UpiService {
  constructor(
    private readonly payments: PaymentsService,
    private readonly ownership: OwnershipService,
    private readonly audit: AuditService,
  ) {}

  /** Parent/student says "I paid this fee, here is the UTR". */
  async submitClaim(dto: { studentFeeId?: string; extraFeeId?: string; utr: string; amount: number }, user: AuthenticatedUser) {
    if (!dto.studentFeeId === !dto.extraFeeId) throw new BadRequestException("Choose exactly one fee to pay");
    const utr = normalizeUtr(dto.utr);
    if (!isValidUtr(utr)) throw new BadRequestException("Enter a valid UTR / transaction reference (10–22 letters or digits)");
    if (!(dto.amount > 0)) throw new BadRequestException("Amount must be greater than zero");

    const ctx = await this.payments.resolveContext({ studentFeeId: dto.studentFeeId, extraFeeId: dto.extraFeeId });
    if (!ctx.studentId) throw new BadRequestException("This fee is not linked to a student");
    await this.ownership.assertCanAccessStudent(ctx.studentId, user);
    if (ctx.remainingAmount !== undefined && dto.amount > ctx.remainingAmount + EPS) {
      throw new BadRequestException(`Amount is more than the remaining balance (₹${ctx.remainingAmount.toFixed(2)})`);
    }

    const [dup] = await db.select().from(schema.upiClaims).where(eq(schema.upiClaims.utr, utr));
    if (dup) throw new ConflictException("This UTR has already been submitted");

    const [claim] = await db
      .insert(schema.upiClaims)
      .values({ studentId: ctx.studentId, studentFeeId: dto.studentFeeId, extraFeeId: dto.extraFeeId, utr, amount: dto.amount, submittedBy: user.sub })
      .returning();
    await this.audit.log({ userId: user.sub, action: "UPI_CLAIM_SUBMITTED", entity: "UpiClaim", entityId: claim.id, description: `UTR ${utr}, amount ${dto.amount}` });

    // The bank credit may already have been entered by the office — match right away.
    const match = await this.matchUtr(utr, user.sub);
    const [fresh] = await db.select().from(schema.upiClaims).where(eq(schema.upiClaims.id, claim.id));
    return { claim: fresh, match };
  }

  /** Admin/accounts: "money with this UTR and amount reached the bank". */
  async addCredit(dto: { utr: string; amount: number }, actorId: string) {
    const utr = normalizeUtr(dto.utr);
    if (!isValidUtr(utr)) throw new BadRequestException("Enter a valid UTR (10–22 letters or digits)");
    if (!(dto.amount > 0)) throw new BadRequestException("Amount must be greater than zero");
    const [dup] = await db.select().from(schema.upiBankCredits).where(eq(schema.upiBankCredits.utr, utr));
    if (dup) throw new ConflictException("This UTR has already been entered");

    const [credit] = await db.insert(schema.upiBankCredits).values({ utr, amount: dto.amount, enteredBy: actorId }).returning();
    await this.audit.log({ userId: actorId, action: "UPI_CREDIT_ENTERED", entity: "UpiBankCredit", entityId: credit.id, description: `UTR ${utr}, amount ${dto.amount}` });
    const match = await this.matchUtr(utr, actorId);
    const [fresh] = await db.select().from(schema.upiBankCredits).where(eq(schema.upiBankCredits.id, credit.id));
    return { credit: fresh, match };
  }

  /** The matching rule: same UTR AND same amount -> approve automatically. */
  async matchUtr(utr: string, actorId: string): Promise<MatchResult> {
    const [claim] = await db.select().from(schema.upiClaims).where(eq(schema.upiClaims.utr, utr));
    const [credit] = await db.select().from(schema.upiBankCredits).where(eq(schema.upiBankCredits.utr, utr));
    if (!claim) return { matched: false, reason: "NO_CLAIM", message: "Saved. No parent/student has submitted this UTR yet — it will approve automatically when they do." };
    if (!credit) return { matched: false, reason: "NO_CREDIT", message: "Waiting for the bank credit to be entered." };
    if (credit.claimId || claim.status === "APPROVED") return { matched: false, reason: "ALREADY_MATCHED", message: "This UTR is already matched." };
    if (claim.status === "REJECTED") return { matched: false, reason: "NO_CLAIM", message: "The claim for this UTR was rejected." };

    if (Math.abs(claim.amount - credit.amount) > EPS) {
      const note = `Amount mismatch: claimed ₹${claim.amount}, bank ₹${credit.amount}`;
      await db.update(schema.upiClaims).set({ note, updatedAt: new Date().toISOString() }).where(eq(schema.upiClaims.id, claim.id));
      return { matched: false, reason: "AMOUNT_MISMATCH", message: `UTR found but the amount differs (${note}). Not approved.` };
    }

    // Claim the row first so two simultaneous matches cannot both create a payment.
    const [locked] = await db
      .update(schema.upiClaims)
      .set({ status: "APPROVED", updatedAt: new Date().toISOString() })
      .where(eq(schema.upiClaims.id, claim.id))
      .returning();
    if (!locked || !OPEN.includes(claim.status)) return { matched: false, reason: "ALREADY_MATCHED", message: "This UTR is already matched." };

    try {
      const { payment } = await this.payments.settleUpiPayment({
        studentId: claim.studentId,
        studentFeeId: claim.studentFeeId,
        extraFeeId: claim.extraFeeId,
        amount: claim.amount,
        utr,
        actorId,
      });
      const now = new Date().toISOString();
      await db.update(schema.upiClaims).set({ paymentId: payment.id, matchedAt: now, note: "Auto-approved (UTR + amount matched)", updatedAt: now }).where(eq(schema.upiClaims.id, claim.id));
      await db.update(schema.upiBankCredits).set({ claimId: claim.id, matchedAt: now, updatedAt: now }).where(eq(schema.upiBankCredits.id, credit.id));
      return { matched: true, claimId: claim.id, paymentId: payment.id };
    } catch (err) {
      const note = `Could not auto-approve: ${err instanceof Error ? err.message : "error"}`;
      await db.update(schema.upiClaims).set({ status: "NEEDS_REVIEW", note, updatedAt: new Date().toISOString() }).where(eq(schema.upiClaims.id, claim.id));
      return { matched: false, reason: "NEEDS_REVIEW", message: note };
    }
  }

  async reject(id: string, reason: string | undefined, actorId: string) {
    const [claim] = await db.select().from(schema.upiClaims).where(eq(schema.upiClaims.id, id));
    if (!claim) throw new NotFoundException("Claim not found");
    if (!OPEN.includes(claim.status)) throw new BadRequestException("Only pending claims can be rejected");
    const [row] = await db
      .update(schema.upiClaims)
      .set({ status: "REJECTED", note: reason?.trim() || "Rejected by admin", updatedAt: new Date().toISOString() })
      .where(eq(schema.upiClaims.id, id))
      .returning();
    await this.audit.log({ userId: actorId, action: "UPI_CLAIM_REJECTED", entity: "UpiClaim", entityId: id, description: reason });
    return row;
  }

  async listClaims(status?: string) {
    const q = db
      .select({ claim: schema.upiClaims, studentName: schema.students.name })
      .from(schema.upiClaims)
      .leftJoin(schema.students, eq(schema.students.id, schema.upiClaims.studentId))
      .orderBy(desc(schema.upiClaims.createdAt))
      .limit(300);
    const rows = status ? await q.where(inArray(schema.upiClaims.status, status.split(","))) : await q;
    return rows.map((r) => ({ ...r.claim, studentName: r.studentName }));
  }

  listCredits() {
    return db.select().from(schema.upiBankCredits).orderBy(desc(schema.upiBankCredits.createdAt)).limit(300);
  }

  async myClaims(user: AuthenticatedUser) {
    return db.select().from(schema.upiClaims).where(eq(schema.upiClaims.submittedBy, user.sub)).orderBy(desc(schema.upiClaims.createdAt)).limit(100);
  }
}
