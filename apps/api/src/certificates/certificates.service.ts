import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { and, desc, eq, inArray, isNull, like, type SQL } from "drizzle-orm";
import { db, schema } from "@nalanda/database";
import type { IssueCertificateDto } from "@nalanda/shared";
import { AuditService } from "../common/audit.service";
import { OwnershipService } from "../common/ownership.service";
import type { AuthenticatedUser } from "../common/types/authenticated-user";
import { PdfCertificateService, type CertificateData, type IdCardData, type SchoolInfo, type StudentSnapshot } from "./pdf-certificate.service";

const isAdmin = (u: AuthenticatedUser) => u.role === "SUPER_ADMIN" || u.role === "ADMIN";
const PREFIX = { BONAFIDE: "BON", TRANSFER: "TC", CHARACTER: "CHR" } as const;

@Injectable()
export class CertificatesService {
  constructor(
    private readonly auditService: AuditService,
    private readonly ownershipService: OwnershipService,
    private readonly pdf: PdfCertificateService,
  ) {}

  private async schoolInfo(): Promise<SchoolInfo> {
    const keys = ["school_name", "school_address", "school_phone", "school_email"];
    const rows = await db.select().from(schema.settings).where(inArray(schema.settings.key, keys));
    const m = new Map(rows.map((r) => [r.key, r.value]));
    return { name: m.get("school_name") || "Nalanda Academy", address: m.get("school_address") || null, phone: m.get("school_phone") || null, email: m.get("school_email") || null };
  }

  private async snapshotOf(studentId: string): Promise<{ student: typeof schema.students.$inferSelect; snapshot: StudentSnapshot }> {
    const [student] = await db.select().from(schema.students).where(eq(schema.students.id, studentId));
    if (!student) throw new NotFoundException("Student not found");
    const [cls] = await db.select().from(schema.classes).where(eq(schema.classes.id, student.classId));
    const [sec] = await db.select().from(schema.sections).where(eq(schema.sections.id, student.sectionId));
    const [year] = await db.select().from(schema.academicYears).where(eq(schema.academicYears.id, student.academicYearId));
    return {
      student,
      snapshot: {
        name: student.name, gender: student.gender, fatherName: student.fatherName, motherName: student.motherName,
        dateOfBirth: student.dateOfBirth, admissionNumber: student.admissionNumber, admissionDate: student.admissionDate,
        className: cls?.name ?? "", sectionName: sec?.name ?? "", academicYear: year?.name ?? "",
      },
    };
  }

  /** BON/2026-27/0001 — counts every number ever issued (cancelled included) so numbers are never reused. */
  private async nextNumber(type: keyof typeof PREFIX, academicYear: string): Promise<string> {
    const base = `${PREFIX[type]}/${academicYear || "NA"}/`;
    const existing = await db.select({ n: schema.certificates.certificateNumber }).from(schema.certificates).where(like(schema.certificates.certificateNumber, `${base}%`));
    const max = existing.reduce((m, r) => Math.max(m, Number(r.n.slice(base.length)) || 0), 0);
    return `${base}${String(max + 1).padStart(4, "0")}`;
  }

  async issue(dto: IssueCertificateDto, actorId: string) {
    const { student, snapshot } = await this.snapshotOf(dto.studentId);

    if (dto.type === "BONAFIDE" && student.status !== "ACTIVE") {
      throw new ConflictException(`Bonafide can only be issued to active students (this student is ${student.status})`);
    }
    if (dto.type === "TRANSFER") {
      if (!dto.dateOfLeaving) throw new BadRequestException("dateOfLeaving is required for a transfer certificate");
      if (dto.dateOfLeaving < student.admissionDate) throw new BadRequestException("dateOfLeaving cannot be before the admission date");
      const [existing] = await db.select().from(schema.certificates).where(and(eq(schema.certificates.studentId, student.id), eq(schema.certificates.type, "TRANSFER"), eq(schema.certificates.status, "ISSUED")));
      if (existing) throw new ConflictException(`A transfer certificate (${existing.certificateNumber}) is already issued; cancel it first to reissue`);
    }

    let row: typeof schema.certificates.$inferSelect | undefined;
    for (let attempt = 0; attempt < 5 && !row; attempt++) {
      const certificateNumber = await this.nextNumber(dto.type, snapshot.academicYear);
      try {
        [row] = await db.insert(schema.certificates).values({
          certificateNumber, type: dto.type, studentId: student.id, issuedOn: new Date().toLocaleDateString("sv"),
          purpose: dto.purpose ?? null, reason: dto.reason ?? null,
          conduct: dto.type === "BONAFIDE" ? null : dto.conduct || "Good",
          dateOfLeaving: dto.dateOfLeaving ?? null, remarks: dto.remarks ?? null,
          snapshot: JSON.stringify(snapshot), issuedByUserId: actorId,
        }).returning();
      } catch (err) {
        if (!/unique/i.test(String((err as Error)?.message ?? err)) || attempt === 4) throw err; // lost a numbering race: retry
      }
    }

    if (dto.type === "TRANSFER" && dto.markStudentLeft) {
      const now = new Date().toISOString();
      await db.update(schema.students).set({ status: "TRANSFERRED", updatedAt: now }).where(eq(schema.students.id, student.id));
      await db.update(schema.hostelAllocations).set({ vacatedAt: now }).where(and(eq(schema.hostelAllocations.studentId, student.id), isNull(schema.hostelAllocations.vacatedAt)));
      await db.update(schema.transportAssignments).set({ endedAt: now }).where(and(eq(schema.transportAssignments.studentId, student.id), isNull(schema.transportAssignments.endedAt)));
    }
    await this.auditService.log({ userId: actorId, action: `CERTIFICATE_ISSUE_${dto.type}`, entity: "Certificate", entityId: row!.id });
    return row!;
  }

  async cancel(id: string, reason: string, actorId: string) {
    const [row] = await db.update(schema.certificates)
      .set({ status: "CANCELLED", cancelledReason: reason, updatedAt: new Date().toISOString() })
      .where(and(eq(schema.certificates.id, id), eq(schema.certificates.status, "ISSUED")))
      .returning();
    if (!row) {
      const [exists] = await db.select().from(schema.certificates).where(eq(schema.certificates.id, id));
      if (!exists) throw new NotFoundException("Certificate not found");
      throw new ConflictException("Certificate is already cancelled");
    }
    await this.auditService.log({ userId: actorId, action: "CERTIFICATE_CANCEL", entity: "Certificate", entityId: id });
    return row;
  }

  /** Admins see everything; students/parents see only the ISSUED certificates of themselves / linked children. */
  async list(user: AuthenticatedUser, filters: { studentId?: string; type?: string; status?: string } = {}) {
    const conds: SQL[] = [];
    if (filters.type) conds.push(eq(schema.certificates.type, filters.type));
    if (isAdmin(user)) {
      if (filters.studentId) conds.push(eq(schema.certificates.studentId, filters.studentId));
      if (filters.status) conds.push(eq(schema.certificates.status, filters.status));
    } else if (user.role === "STUDENT" || user.role === "PARENT") {
      conds.push(eq(schema.certificates.status, "ISSUED"));
      if (user.role === "STUDENT") conds.push(eq(schema.certificates.studentId, user.profileId!));
      else {
        const ids = await this.ownershipService.getLinkedStudentIds(user.profileId!);
        if (filters.studentId) {
          if (!ids.includes(filters.studentId)) throw new ForbiddenException();
          conds.push(eq(schema.certificates.studentId, filters.studentId));
        } else {
          if (ids.length === 0) return [];
          conds.push(inArray(schema.certificates.studentId, ids));
        }
      }
    } else throw new ForbiddenException();

    return db.select({
      id: schema.certificates.id, certificateNumber: schema.certificates.certificateNumber, type: schema.certificates.type,
      issuedOn: schema.certificates.issuedOn, status: schema.certificates.status, purpose: schema.certificates.purpose,
      cancelledReason: schema.certificates.cancelledReason, studentId: schema.students.id, studentName: schema.students.name,
    })
      .from(schema.certificates)
      .innerJoin(schema.students, eq(schema.students.id, schema.certificates.studentId))
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(desc(schema.certificates.createdAt))
      .limit(300);
  }

  async renderPdf(id: string, user: AuthenticatedUser): Promise<{ pdf: Buffer; filename: string }> {
    const [row] = await db.select().from(schema.certificates).where(eq(schema.certificates.id, id));
    if (!row) throw new NotFoundException("Certificate not found");
    if (!isAdmin(user)) {
      await this.ownershipService.assertCanAccessStudent(row.studentId, user);
      if (user.role !== "STUDENT" && user.role !== "PARENT") throw new ForbiddenException();
      if (row.status !== "ISSUED") throw new NotFoundException("Certificate not found");
    }
    const data: CertificateData = { ...row, type: row.type as CertificateData["type"], snapshot: JSON.parse(row.snapshot) };
    const pdf = await this.pdf.renderCertificate(data, await this.schoolInfo());
    return { pdf, filename: `${row.certificateNumber.replace(/\//g, "-")}.pdf` };
  }

  /** ID cards for one student, or every active student of a class(/section). Admin only. */
  async renderIdCards(filters: { studentId?: string; classId?: string; sectionId?: string }): Promise<Buffer> {
    if (!filters.studentId && !filters.classId) throw new BadRequestException("Provide studentId or classId");
    const conds: SQL[] = [eq(schema.students.status, "ACTIVE")];
    if (filters.studentId) conds.push(eq(schema.students.id, filters.studentId));
    else {
      conds.push(eq(schema.students.classId, filters.classId!));
      if (filters.sectionId) conds.push(eq(schema.students.sectionId, filters.sectionId));
    }
    const rows = await db.select({ s: schema.students, className: schema.classes.name, sectionName: schema.sections.name, year: schema.academicYears.name })
      .from(schema.students)
      .innerJoin(schema.classes, eq(schema.classes.id, schema.students.classId))
      .innerJoin(schema.sections, eq(schema.sections.id, schema.students.sectionId))
      .innerJoin(schema.academicYears, eq(schema.academicYears.id, schema.students.academicYearId))
      .where(and(...conds))
      .orderBy(schema.sections.name, schema.students.rollNumber)
      .limit(500);
    if (rows.length === 0) throw new NotFoundException("No active students found");
    const cards: IdCardData[] = rows.map((r) => ({
      name: r.s.name, className: r.className, sectionName: r.sectionName, rollNumber: r.s.rollNumber, admissionNumber: r.s.admissionNumber,
      dateOfBirth: r.s.dateOfBirth, fatherName: r.s.fatherName, phone: r.s.phone, academicYear: r.year,
    }));
    return this.pdf.renderIdCards(cards, await this.schoolInfo());
  }
}
