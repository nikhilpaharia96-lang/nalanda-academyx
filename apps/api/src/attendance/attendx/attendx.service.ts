import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { and, eq, gte, inArray, isNull, lte, sql } from "drizzle-orm";
import { randomBytes, randomUUID } from "node:crypto";
import { db, schema } from "@nalanda/database";
import type {
  AttendxDecisionDto,
  LaunchCheckDto,
  StartAttendxSessionDto,
  SubmitCheckDto,
} from "@nalanda/shared";
import { AuditService } from "../../common/audit.service";
import { OwnershipService } from "../../common/ownership.service";
import { toFriendlyConflictError } from "../../common/db-errors";
import type { AuthenticatedUser } from "../../common/types/authenticated-user";
import { codeDigest, currentSlot, generateCode, qrToken, safeEqual, sha256, verifyQrToken } from "./crypto-tokens";
import { isValidP256PublicKey, signaturePayload, verifySignature } from "./device-signature";
import { CHECK_WEIGHTS, scoreStudent, type CheckInput, type Outcome } from "./scoring";

const NONCE_TTL_MS = 30_000;
const MAX_ATTEMPTS_PER_CHECK = 3;
const LATE_NETWORK_MAX_SLOT_AGE = 6; // a resubmit after a bad connection: up to 6 slots (60 s at 10 s slots)
const FAST_SCAN_MS = 500; // under this after a slot starts looks automated; a soft signal only
const BINDING_CODE_TTL_MS = 7 * 24 * 3600 * 1000;

const iso = (ms: number) => new Date(ms).toISOString();

type Session = typeof schema.attxSessions.$inferSelect;
type Check = typeof schema.attxChecks.$inferSelect;

@Injectable()
export class AttendxService {
  constructor(
    private readonly auditService: AuditService,
    private readonly ownershipService: OwnershipService,
  ) {}

  // ------------------------------------------------------------------ device binding

  /** Admin issues a one-time code, handed to the student in person. The code is returned once and only its hash is stored. */
  async issueBindingCode(studentId: string, user: AuthenticatedUser) {
    const [student] = await db.select().from(schema.students).where(eq(schema.students.id, studentId));
    if (!student) throw new NotFoundException("Student not found");
    const code = generateCode(8);
    const expiresAt = iso(Date.now() + BINDING_CODE_TTL_MS);
    await db.insert(schema.attxBindingCodes).values({ studentId, codeHash: sha256(code), expiresAt, createdBy: user.sub });
    await this.auditService.log({
      userId: user.sub,
      action: "ATTENDX_BINDING_CODE_ISSUED",
      entity: "AttxDevice",
      entityId: studentId,
      description: `Issued a device binding code for student ${studentId}`,
    });
    return { code, expiresAt };
  }

  /** Registers the student's device key. Only possible with a valid, unused, unexpired code issued for this student. */
  async bindDevice(dto: { code: string; publicKey: string }, user: AuthenticatedUser) {
    const studentId = this.requireStudent(user);
    const fail = () => new BadRequestException("Invalid or expired binding code"); // one message for every failure: no oracle
    if (!isValidP256PublicKey(dto.publicKey)) throw new BadRequestException("Unsupported device key");

    const [row] = await db
      .select()
      .from(schema.attxBindingCodes)
      .where(and(eq(schema.attxBindingCodes.codeHash, sha256(dto.code.trim().toUpperCase())), eq(schema.attxBindingCodes.studentId, studentId), isNull(schema.attxBindingCodes.usedAt)));
    if (!row || row.expiresAt < iso(Date.now())) throw fail();

    // Atomic claim: only one request can flip usedAt from null.
    const claimed = await db
      .update(schema.attxBindingCodes)
      .set({ usedAt: iso(Date.now()) })
      .where(and(eq(schema.attxBindingCodes.id, row.id), isNull(schema.attxBindingCodes.usedAt)))
      .returning();
    if (claimed.length === 0) throw fail();

    const now = iso(Date.now());
    await db.update(schema.attxDevices).set({ revokedAt: now }).where(and(eq(schema.attxDevices.studentId, studentId), isNull(schema.attxDevices.revokedAt)));
    try {
      await db.insert(schema.attxDevices).values({ studentId, publicKey: dto.publicKey, boundAt: now });
    } catch (err) {
      throw toFriendlyConflictError(err, "device key");
    }
    await this.auditService.log({ userId: user.sub, action: "ATTENDX_DEVICE_BOUND", entity: "AttxDevice", entityId: studentId, description: "Device bound via binding code" });
    return { bound: true };
  }

  // ------------------------------------------------------------------ teacher: session lifecycle

  async startSession(dto: StartAttendxSessionDto, user: AuthenticatedUser) {
    if (user.role !== "TEACHER") throw new ForbiddenException();
    await this.ownershipService.assertTeacherAssignedToClass(dto.classId, dto.sectionId, user);

    const [open] = await db
      .select()
      .from(schema.attxSessions)
      .where(and(eq(schema.attxSessions.teacherId, user.profileId!), eq(schema.attxSessions.classId, dto.classId), eq(schema.attxSessions.sectionId, dto.sectionId), eq(schema.attxSessions.status, "OPEN")));
    if (open) throw new ConflictException("You already have an open attendance session for this class");

    const now = Date.now();
    const sessionId = randomUUID();
    const initialCheckId = randomUUID();
    await db.insert(schema.attxSessions).values({
      id: sessionId,
      teacherId: user.profileId!,
      classId: dto.classId,
      sectionId: dto.sectionId,
      academicYearId: dto.academicYearId,
      subjectId: dto.subjectId,
      startedAt: iso(now),
      status: "OPEN",
      qrIntervalSec: dto.qrIntervalSec,
      minScore: dto.minScore,
    });
    await db.insert(schema.attxSessionSecrets).values({ sessionId, qrSecret: randomBytes(32).toString("base64url") });
    await db.insert(schema.attxChecks).values({
      id: initialCheckId,
      sessionId,
      kind: "INITIAL",
      weight: CHECK_WEIGHTS.INITIAL,
      opensAt: iso(now),
      closesAt: iso(now + dto.initialWindowSec * 1000),
    });
    return { sessionId, initialCheckId, qrIntervalSec: dto.qrIntervalSec };
  }

  /** Current rotating QR token. Only the session's teacher (or an admin) can fetch it; students never see this endpoint. */
  async getQr(sessionId: string, user: AuthenticatedUser) {
    const session = await this.loadSession(sessionId, user);
    if (session.status !== "OPEN") throw new BadRequestException("Session is closed");
    const secret = await this.secretFor(sessionId);
    const now = Date.now();
    const slot = currentSlot(now, session.qrIntervalSec);
    return {
      token: qrToken(secret, sessionId, slot),
      slot,
      intervalSec: session.qrIntervalSec,
      expiresInMs: (slot + 1) * session.qrIntervalSec * 1000 - now,
    };
  }

  /** Teacher presses Challenge or a re-ping. The room code is returned once, to the teacher, to show in the room. */
  async launchCheck(sessionId: string, dto: LaunchCheckDto, user: AuthenticatedUser) {
    const session = await this.loadSession(sessionId, user);
    if (session.status !== "OPEN") throw new BadRequestException("Session is closed");
    const secret = await this.secretFor(sessionId);
    const checkId = randomUUID();
    const code = generateCode(5);
    const now = Date.now();
    await db.insert(schema.attxChecks).values({
      id: checkId,
      sessionId,
      kind: dto.kind,
      weight: CHECK_WEIGHTS[dto.kind],
      codeDigest: codeDigest(secret, checkId, code),
      opensAt: iso(now),
      closesAt: iso(now + dto.durationSec * 1000),
    });
    return { checkId, code, closesAt: iso(now + dto.durationSec * 1000) };
  }

  async getLive(sessionId: string, user: AuthenticatedUser) {
    const session = await this.loadSession(sessionId, user);
    const checks = await db.select().from(schema.attxChecks).where(eq(schema.attxChecks.sessionId, sessionId));
    const responses = await db.select().from(schema.attxResponses).where(eq(schema.attxResponses.sessionId, sessionId));
    const students = await this.activeStudents(session);
    const passed = new Map<string, number>();
    for (const r of responses) passed.set(r.studentId, (passed.get(r.studentId) ?? 0) + 1);
    return {
      status: session.status,
      checks: checks.map((c) => ({ id: c.id, kind: c.kind, opensAt: c.opensAt, closesAt: c.closesAt })),
      students: students.map((s) => ({ studentId: s.id, name: s.name, rollNumber: s.rollNumber, checksPassed: passed.get(s.id) ?? 0, checksTotal: checks.length })),
    };
  }

  /** Closes the session and computes proposed statuses. Responses stamped after the close time are ignored. */
  async closeSession(sessionId: string, user: AuthenticatedUser) {
    const session = await this.loadSession(sessionId, user);
    if (session.status === "CLOSED") return this.summary(sessionId);

    const endedAt = iso(Date.now());
    const closed = await db
      .update(schema.attxSessions)
      .set({ status: "CLOSED", endedAt })
      .where(and(eq(schema.attxSessions.id, sessionId), eq(schema.attxSessions.status, "OPEN")))
      .returning();
    if (closed.length === 0) return this.summary(sessionId);

    const checks = await db.select().from(schema.attxChecks).where(eq(schema.attxChecks.sessionId, sessionId));
    const checkInputs: CheckInput[] = checks.map((c) => ({ id: c.id, kind: c.kind as CheckInput["kind"], weight: c.weight }));
    const responses = await db
      .select()
      .from(schema.attxResponses)
      .where(and(eq(schema.attxResponses.sessionId, sessionId), lte(schema.attxResponses.submittedAt, endedAt)));
    const nonces = checks.length
      ? await db.select().from(schema.attxNonces).where(inArray(schema.attxNonces.checkId, checks.map((c) => c.id)))
      : [];

    const students = await this.activeStudents(session);
    for (const s of students) {
      const mine = responses.filter((r) => r.studentId === s.id);
      const outcomes: Record<string, Outcome> = {};
      const flags: string[] = [];
      for (const r of mine) {
        outcomes[r.checkId] = r.outcome as Outcome;
        for (const f of JSON.parse(r.flags) as string[]) flags.push(f);
      }
      if (nonces.filter((n) => n.studentId === s.id && n.result === "WRONG_CODE").length >= 2) flags.push("MANY_WRONG_CODES");
      const result = scoreStudent(checkInputs, outcomes, flags, session.minScore);
      await db
        .insert(schema.attxResults)
        .values({ sessionId, studentId: s.id, proposedStatus: result.proposed, score: result.score, flags: JSON.stringify(result.flags) })
        .onConflictDoNothing();
    }
    return this.summary(sessionId);
  }

  async getResults(sessionId: string, user: AuthenticatedUser) {
    await this.loadSession(sessionId, user);
    const rows = await db
      .select({ r: schema.attxResults, name: schema.students.name, rollNumber: schema.students.rollNumber })
      .from(schema.attxResults)
      .innerJoin(schema.students, eq(schema.students.id, schema.attxResults.studentId))
      .where(eq(schema.attxResults.sessionId, sessionId))
      .orderBy(schema.students.rollNumber);
    return rows.map(({ r, name, rollNumber }) => ({
      studentId: r.studentId,
      name,
      rollNumber,
      proposedStatus: r.proposedStatus,
      score: r.score,
      flags: JSON.parse(r.flags) as string[],
      finalStatus: r.finalStatus,
      finalReason: r.finalReason,
    }));
  }

  /** The teacher's decision is final. A reason is mandatory and every decision is audit-logged. */
  async decide(sessionId: string, studentId: string, dto: AttendxDecisionDto, user: AuthenticatedUser) {
    const session = await this.loadSession(sessionId, user);
    if (session.status !== "CLOSED") throw new BadRequestException("Close the session before deciding");
    const updated = await db
      .update(schema.attxResults)
      .set({ finalStatus: dto.status, finalReason: dto.reason, finalBy: user.sub, finalAt: iso(Date.now()), updatedAt: iso(Date.now()) })
      .where(and(eq(schema.attxResults.sessionId, sessionId), eq(schema.attxResults.studentId, studentId)))
      .returning();
    if (updated.length === 0) throw new NotFoundException("No result for this student in this session");
    await this.auditService.log({
      userId: user.sub,
      action: "ATTENDX_DECISION",
      entity: "AttxResult",
      entityId: updated[0].id,
      description: `Set ${dto.status} for student ${studentId} in session ${sessionId}: ${dto.reason}`,
    });
    return updated[0];
  }

  /** Teacher accepts every PRESENT/ABSENT proposal in one tap. REVIEW rows are never auto-confirmed. */
  async confirmProposed(sessionId: string, user: AuthenticatedUser) {
    const session = await this.loadSession(sessionId, user);
    if (session.status !== "CLOSED") throw new BadRequestException("Close the session first");
    const rows = await db
      .select()
      .from(schema.attxResults)
      .where(and(eq(schema.attxResults.sessionId, sessionId), isNull(schema.attxResults.finalStatus)));
    let confirmed = 0;
    for (const r of rows) {
      if (r.proposedStatus === "REVIEW") continue;
      await db
        .update(schema.attxResults)
        .set({ finalStatus: r.proposedStatus, finalReason: "Confirmed system proposal", finalBy: user.sub, finalAt: iso(Date.now()), updatedAt: iso(Date.now()) })
        .where(and(eq(schema.attxResults.id, r.id), isNull(schema.attxResults.finalStatus)));
      confirmed++;
    }
    await this.auditService.log({ userId: user.sub, action: "ATTENDX_CONFIRM_PROPOSED", entity: "AttxSession", entityId: sessionId, description: `Confirmed ${confirmed} proposed statuses` });
    return { confirmed, stillInReview: rows.filter((r) => r.proposedStatus === "REVIEW").length };
  }

  // ------------------------------------------------------------------ student: checks

  /** Open checks for the signed-in student's class. Never returns secrets, codes or other students. */
  async openChecks(user: AuthenticatedUser) {
    const studentId = this.requireStudent(user);
    const student = await this.getActiveStudent(studentId);
    const now = iso(Date.now());
    const rows = await db
      .select({ check: schema.attxChecks, sessionId: schema.attxSessions.id })
      .from(schema.attxChecks)
      .innerJoin(schema.attxSessions, eq(schema.attxSessions.id, schema.attxChecks.sessionId))
      .where(
        and(
          eq(schema.attxSessions.classId, student.classId),
          eq(schema.attxSessions.sectionId, student.sectionId),
          eq(schema.attxSessions.status, "OPEN"),
          lte(schema.attxChecks.opensAt, now),
          gte(schema.attxChecks.closesAt, now),
        ),
      );
    const done = await db.select().from(schema.attxResponses).where(eq(schema.attxResponses.studentId, studentId));
    const doneIds = new Set(done.map((d) => d.checkId));
    return rows
      .filter((r) => !doneIds.has(r.check.id))
      .map((r) => ({ sessionId: r.sessionId, checkId: r.check.id, kind: r.check.kind, closesAt: r.check.closesAt, needsQr: r.check.kind === "INITIAL", needsCode: r.check.kind !== "INITIAL" }));
  }

  /** One-time nonce for a check. Capped per (check, student): this is the attempt limit against code guessing. */
  async requestNonce(checkId: string, user: AuthenticatedUser) {
    const studentId = this.requireStudent(user);
    const { check } = await this.loadOpenCheckForStudent(checkId, studentId);
    await this.requireActiveDevice(studentId);

    const [done] = await db.select().from(schema.attxResponses).where(and(eq(schema.attxResponses.checkId, checkId), eq(schema.attxResponses.studentId, studentId)));
    if (done) throw new ConflictException("Already recorded for this check");

    const [{ n }] = await db
      .select({ n: sql<number>`count(*)` })
      .from(schema.attxNonces)
      .where(and(eq(schema.attxNonces.checkId, checkId), eq(schema.attxNonces.studentId, studentId)));
    if (Number(n) >= MAX_ATTEMPTS_PER_CHECK) throw new ForbiddenException("Too many attempts for this check. Ask your teacher.");

    const nonce = randomBytes(18).toString("base64url");
    const expiresAt = iso(Math.min(Date.now() + NONCE_TTL_MS, Date.parse(check.closesAt) + 5_000));
    await db.insert(schema.attxNonces).values({ nonce, checkId, studentId, expiresAt });
    return { nonce, expiresAt };
  }

  /** Verifies and records one check response. Every flag and outcome is computed here, never taken from the client. */
  async submit(checkId: string, dto: SubmitCheckDto, user: AuthenticatedUser) {
    const studentId = this.requireStudent(user);
    const { check, session } = await this.loadOpenCheckForStudent(checkId, studentId);
    const nowMs = Date.now();

    // 1. Claim the nonce atomically. A replayed or reused request finds nothing to claim.
    const [nonceRow] = await db
      .select()
      .from(schema.attxNonces)
      .where(and(eq(schema.attxNonces.nonce, dto.nonce), eq(schema.attxNonces.checkId, checkId), eq(schema.attxNonces.studentId, studentId)));
    if (!nonceRow || nonceRow.expiresAt < iso(nowMs)) throw new UnauthorizedException("Invalid or expired request");
    const claimed = await db
      .update(schema.attxNonces)
      .set({ usedAt: iso(nowMs), updatedAt: iso(nowMs) })
      .where(and(eq(schema.attxNonces.id, nonceRow.id), isNull(schema.attxNonces.usedAt)))
      .returning();
    if (claimed.length === 0) throw new UnauthorizedException("Invalid or expired request");
    const markNonce = (result: string) => db.update(schema.attxNonces).set({ result, updatedAt: iso(Date.now()) }).where(eq(schema.attxNonces.id, nonceRow.id));

    // 2. Device signature over (check, nonce, qr token, answer).
    const device = await this.requireActiveDevice(studentId);
    const payload = signaturePayload({ checkId, nonce: dto.nonce, qrToken: dto.qrToken, answer: dto.answer });
    if (!verifySignature(device.publicKey, payload, dto.signature)) {
      await markNonce("BAD_SIGNATURE");
      throw new UnauthorizedException("Invalid device signature");
    }

    // 3. Evidence specific to the check kind.
    const secret = await this.secretFor(session.id);
    const flags: string[] = [];
    let outcome: Outcome = "PASS";
    let latencyMs: number | null = null;
    let slot: number | null = null;

    if (check.kind === "INITIAL") {
      const verdict = verifyQrToken(secret, session.id, dto.qrToken ?? "", nowMs, session.qrIntervalSec, LATE_NETWORK_MAX_SLOT_AGE);
      if (!verdict.ok) {
        await markNonce("BAD_QR");
        throw new BadRequestException("QR code is not valid or has expired. Scan the current one.");
      }
      slot = verdict.slot;
      latencyMs = nowMs - verdict.slot * session.qrIntervalSec * 1000;
      if (verdict.slotAge > 1) {
        outcome = "LATE_OK";
        flags.push("LATE_NETWORK");
      } else if (latencyMs < FAST_SCAN_MS) {
        flags.push("FAST_SCAN");
      }
    } else {
      if (!dto.answer || !check.codeDigest || !safeEqual(check.codeDigest, codeDigest(secret, checkId, dto.answer))) {
        await markNonce("WRONG_CODE");
        throw new BadRequestException("Incorrect code");
      }
    }

    // 4. One use per QR slot per student.
    if (slot !== null) {
      const used = await db.insert(schema.attxSlotUses).values({ sessionId: session.id, studentId, slot }).onConflictDoNothing().returning();
      if (used.length === 0) {
        await markNonce("BAD_QR");
        throw new ConflictException("This QR slot was already used");
      }
    }

    // 5. Record once. The unique (check, student) index makes concurrent duplicates harmless.
    const inserted = await db
      .insert(schema.attxResponses)
      .values({ sessionId: session.id, checkId, studentId, deviceId: device.id, outcome, flags: JSON.stringify(flags), latencyMs, submittedAt: iso(nowMs) })
      .onConflictDoNothing()
      .returning();
    await markNonce("OK");
    if (inserted.length === 0) return { status: "ALREADY_RECORDED" as const };
    return { status: "RECORDED" as const, outcome };
  }

  // ------------------------------------------------------------------ helpers

  private requireStudent(user: AuthenticatedUser): string {
    if (user.role !== "STUDENT" || !user.profileId) throw new ForbiddenException();
    return user.profileId;
  }

  private async getActiveStudent(studentId: string) {
    const [student] = await db.select().from(schema.students).where(eq(schema.students.id, studentId));
    if (!student || student.status !== "ACTIVE") throw new ForbiddenException();
    return student;
  }

  private async requireActiveDevice(studentId: string) {
    const [device] = await db
      .select()
      .from(schema.attxDevices)
      .where(and(eq(schema.attxDevices.studentId, studentId), isNull(schema.attxDevices.revokedAt)));
    if (!device) throw new ForbiddenException("No bound device. Ask the office for a binding code.");
    return device;
  }

  private async secretFor(sessionId: string): Promise<string> {
    const [row] = await db.select().from(schema.attxSessionSecrets).where(eq(schema.attxSessionSecrets.sessionId, sessionId));
    if (!row) throw new NotFoundException("Session not found");
    return row.qrSecret;
  }

  /** Session lookup with ownership: the session's own teacher, or an admin. */
  private async loadSession(sessionId: string, user: AuthenticatedUser): Promise<Session> {
    const [session] = await db.select().from(schema.attxSessions).where(eq(schema.attxSessions.id, sessionId));
    if (!session) throw new NotFoundException("Session not found");
    if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") return session;
    if (user.role === "TEACHER" && session.teacherId === user.profileId) return session;
    throw new ForbiddenException();
  }

  /** For a student: the check must exist, be inside its window, belong to an OPEN session of the student's own class. */
  private async loadOpenCheckForStudent(checkId: string, studentId: string): Promise<{ check: Check; session: Session }> {
    const student = await this.getActiveStudent(studentId);
    const [check] = await db.select().from(schema.attxChecks).where(eq(schema.attxChecks.id, checkId));
    if (!check) throw new NotFoundException("Check not found");
    const [session] = await db.select().from(schema.attxSessions).where(eq(schema.attxSessions.id, check.sessionId));
    if (!session || session.classId !== student.classId || session.sectionId !== student.sectionId) throw new NotFoundException("Check not found");
    const now = iso(Date.now());
    if (session.status !== "OPEN" || check.opensAt > now || check.closesAt < now) throw new BadRequestException("This check is closed");
    return { check, session };
  }

  private activeStudents(session: Session) {
    return db
      .select()
      .from(schema.students)
      .where(and(eq(schema.students.classId, session.classId), eq(schema.students.sectionId, session.sectionId), eq(schema.students.status, "ACTIVE")))
      .orderBy(schema.students.rollNumber);
  }

  private async summary(sessionId: string) {
    const rows = await db.select().from(schema.attxResults).where(eq(schema.attxResults.sessionId, sessionId));
    const count = (s: string) => rows.filter((r) => r.proposedStatus === s).length;
    return { sessionId, present: count("PRESENT"), review: count("REVIEW"), absent: count("ABSENT"), total: rows.length };
  }
}
