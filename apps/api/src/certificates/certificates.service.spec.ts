import { BadRequestException, ConflictException, ForbiddenException } from "@nestjs/common";
import { db, schema } from "@nalanda/database";
import { eq } from "drizzle-orm";
import { CertificatesService } from "./certificates.service";
import { PdfCertificateService } from "./pdf-certificate.service";
import { AuditService } from "../common/audit.service";
import { OwnershipService } from "../common/ownership.service";
import { admin, makeBase, makeParent, makeStudent, parentUser, studentUser } from "../campus.fixtures";

describe("CertificatesService", () => {
  const service = new CertificatesService(new AuditService(), new OwnershipService(), new PdfCertificateService());
  const isPdf = (b: Buffer) => b.subarray(0, 5).toString() === "%PDF-" && b.length > 1500;
  const get = async (id: string) => (await db.select().from(schema.students).where(eq(schema.students.id, id)))[0];

  it("issues numbered certificates that never repeat, even after cancellation", async () => {
    const base = await makeBase();
    const student = await makeStudent(base);
    const a = await service.issue({ type: "BONAFIDE", studentId: student.id, purpose: "bank account" }, admin.sub);
    const b = await service.issue({ type: "BONAFIDE", studentId: student.id }, admin.sub);
    expect(a.certificateNumber).toMatch(/^BON\/.+\/0001$/);
    expect(b.certificateNumber).toMatch(/^BON\/.+\/0002$/);

    await service.cancel(b.id, "Wrong details", admin.sub);
    const c = await service.issue({ type: "BONAFIDE", studentId: student.id }, admin.sub);
    expect(c.certificateNumber).toMatch(/\/0003$/);
  });

  it("renders valid PDFs for every certificate type and ID cards", async () => {
    const base = await makeBase();
    const student = await makeStudent(base);
    const bon = await service.issue({ type: "BONAFIDE", studentId: student.id, purpose: "scholarship" }, admin.sub);
    const chr = await service.issue({ type: "CHARACTER", studentId: student.id, conduct: "Excellent" }, admin.sub);
    const tc = await service.issue({ type: "TRANSFER", studentId: student.id, dateOfLeaving: "2026-12-01", reason: "Parent transfer" }, admin.sub);
    for (const c of [bon, chr, tc]) expect(isPdf((await service.renderPdf(c.id, admin)).pdf)).toBe(true);
    expect(isPdf(await service.renderIdCards({ studentId: student.id }))).toBe(true);
    expect(isPdf(await service.renderIdCards({ classId: base.c1.id }))).toBe(true);
  });

  it("a certificate keeps the class it was issued with after the student is promoted", async () => {
    const base = await makeBase();
    const student = await makeStudent(base);
    const cert = await service.issue({ type: "BONAFIDE", studentId: student.id }, admin.sub);
    await db.update(schema.students).set({ classId: base.c2.id, sectionId: base.s2.id }).where(eq(schema.students.id, student.id));
    const [row] = await db.select().from(schema.certificates).where(eq(schema.certificates.id, cert.id));
    expect(JSON.parse(row.snapshot).className).toBe(base.c1.name);
  });

  it("transfer certificate needs a leaving date and can only be issued once until cancelled", async () => {
    const base = await makeBase();
    const student = await makeStudent(base);
    await expect(service.issue({ type: "TRANSFER", studentId: student.id }, admin.sub)).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.issue({ type: "TRANSFER", studentId: student.id, dateOfLeaving: "2000-01-01" }, admin.sub)).rejects.toBeInstanceOf(BadRequestException);

    const tc = await service.issue({ type: "TRANSFER", studentId: student.id, dateOfLeaving: "2026-12-01" }, admin.sub);
    await expect(service.issue({ type: "TRANSFER", studentId: student.id, dateOfLeaving: "2026-12-02" }, admin.sub)).rejects.toBeInstanceOf(ConflictException);
    await service.cancel(tc.id, "Issued by mistake", admin.sub);
    await expect(service.issue({ type: "TRANSFER", studentId: student.id, dateOfLeaving: "2026-12-02" }, admin.sub)).resolves.toBeDefined();
  });

  it("markStudentLeft marks the student TRANSFERRED and releases hostel and bus; otherwise nothing changes", async () => {
    const base = await makeBase();
    const stays = await makeStudent(base, "1");
    const leaves = await makeStudent(base, "2");
    const [hostel] = await db.insert(schema.hostels).values({ name: `H-${leaves.id}` }).returning();
    const [alloc] = await db.insert(schema.hostelAllocations).values({ hostelId: hostel.id, studentId: leaves.id, roomNumber: "1" }).returning();
    const [route] = await db.insert(schema.transportRoutes).values({ name: `R-${leaves.id}` }).returning();
    const [ta] = await db.insert(schema.transportAssignments).values({ studentId: leaves.id, routeId: route.id }).returning();

    await service.issue({ type: "TRANSFER", studentId: stays.id, dateOfLeaving: "2026-12-01" }, admin.sub);
    expect((await get(stays.id)).status).toBe("ACTIVE");

    await service.issue({ type: "TRANSFER", studentId: leaves.id, dateOfLeaving: "2026-12-01", markStudentLeft: true }, admin.sub);
    expect((await get(leaves.id)).status).toBe("TRANSFERRED");
    expect((await db.select().from(schema.hostelAllocations).where(eq(schema.hostelAllocations.id, alloc.id)))[0].vacatedAt).not.toBeNull();
    expect((await db.select().from(schema.transportAssignments).where(eq(schema.transportAssignments.id, ta.id)))[0].endedAt).not.toBeNull();
  });

  it("bonafide is refused for students who are no longer active", async () => {
    const base = await makeBase();
    const student = await makeStudent(base);
    await db.update(schema.students).set({ status: "TRANSFERRED" }).where(eq(schema.students.id, student.id));
    await expect(service.issue({ type: "BONAFIDE", studentId: student.id }, admin.sub)).rejects.toBeInstanceOf(ConflictException);
  });

  it("students and parents only see and download their own ISSUED certificates", async () => {
    const base = await makeBase();
    const me = await makeStudent(base, "1");
    const other = await makeStudent(base, "2");
    const parent = await makeParent(me);
    const mine = await service.issue({ type: "BONAFIDE", studentId: me.id }, admin.sub);
    const theirs = await service.issue({ type: "BONAFIDE", studentId: other.id }, admin.sub);
    const cancelled = await service.issue({ type: "CHARACTER", studentId: me.id }, admin.sub);
    await service.cancel(cancelled.id, "Duplicate entry", admin.sub);

    expect((await service.list(studentUser(me.id))).map((c) => c.id)).toEqual([mine.id]);
    expect((await service.list(parentUser(parent.id))).map((c) => c.id)).toEqual([mine.id]);
    await expect(service.list(parentUser(parent.id), { studentId: other.id })).rejects.toBeInstanceOf(ForbiddenException);

    expect(isPdf((await service.renderPdf(mine.id, studentUser(me.id))).pdf)).toBe(true);
    await expect(service.renderPdf(theirs.id, studentUser(me.id))).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.renderPdf(cancelled.id, studentUser(me.id))).rejects.toThrow();
    expect(isPdf((await service.renderPdf(cancelled.id, admin)).pdf)).toBe(true); // admins can still print a cancelled copy (watermarked)
  });

  it("cannot cancel twice", async () => {
    const base = await makeBase();
    const student = await makeStudent(base);
    const c = await service.issue({ type: "CHARACTER", studentId: student.id }, admin.sub);
    await service.cancel(c.id, "Test cancel", admin.sub);
    await expect(service.cancel(c.id, "Again", admin.sub)).rejects.toBeInstanceOf(ConflictException);
  });
});
