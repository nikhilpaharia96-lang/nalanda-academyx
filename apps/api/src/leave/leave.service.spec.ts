import { BadRequestException, ConflictException, ForbiddenException } from "@nestjs/common";
import { LeaveService } from "./leave.service";
import { AuditService } from "../common/audit.service";
import { OwnershipService } from "../common/ownership.service";
import { admin, assignTeacher, makeBase, makeParent, makeStudent, makeTeacher, parentUser, studentUser, teacherUser } from "../campus.fixtures";

describe("LeaveService", () => {
  const service = new LeaveService(new AuditService(), new OwnershipService());

  it("parent applies for a child, class teacher approves, and it shows for everyone concerned", async () => {
    const base = await makeBase();
    await assignTeacher(base, base.teacher);
    const student = await makeStudent(base);
    const parent = await makeParent(student);

    const req = await service.apply({ studentId: student.id, fromDate: "2026-12-01", toDate: "2026-12-03", reason: "Fever" }, parentUser(parent.id));
    expect(req.status).toBe("PENDING");
    expect(await service.list(teacherUser(base.teacher.id))).toHaveLength(1);

    const done = await service.review(req.id, { decision: "APPROVED", note: "Get well soon" }, teacherUser(base.teacher.id));
    expect(done).toMatchObject({ status: "APPROVED", reviewNote: "Get well soon" });
    expect((await service.list(studentUser(student.id)))[0].status).toBe("APPROVED");
  });

  it("students can't approve; a teacher of another class can't see or review", async () => {
    const base = await makeBase();
    await assignTeacher(base, base.teacher);
    const outsider = await makeTeacher();
    const student = await makeStudent(base);
    const req = await service.apply({ fromDate: "2026-12-05", toDate: "2026-12-05", reason: "Family function" }, studentUser(student.id));

    await expect(service.review(req.id, { decision: "APPROVED" }, studentUser(student.id))).rejects.toBeInstanceOf(ForbiddenException);
    expect(await service.list(teacherUser(outsider.id))).toHaveLength(0);
    await expect(service.review(req.id, { decision: "APPROVED" }, teacherUser(outsider.id))).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("rejects bad dates, over-long ranges and overlapping requests", async () => {
    const base = await makeBase();
    const student = await makeStudent(base);
    const me = studentUser(student.id);
    await expect(service.apply({ fromDate: "2026-12-10", toDate: "2026-12-09", reason: "Trip" }, me)).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.apply({ fromDate: "2026-12-01", toDate: "2027-02-01", reason: "Long trip" }, me)).rejects.toBeInstanceOf(BadRequestException);

    await service.apply({ fromDate: "2026-12-10", toDate: "2026-12-12", reason: "Trip" }, me);
    await expect(service.apply({ fromDate: "2026-12-12", toDate: "2026-12-14", reason: "Trip again" }, me)).rejects.toBeInstanceOf(ConflictException);
    await expect(service.apply({ fromDate: "2026-12-13", toDate: "2026-12-14", reason: "Fine" }, me)).resolves.toBeDefined();
  });

  it("parents can only apply for their own child; decided requests can't be re-reviewed or cancelled", async () => {
    const base = await makeBase();
    const student = await makeStudent(base, "1");
    const otherChild = await makeStudent(base, "2");
    const parent = await makeParent(student);
    await expect(
      service.apply({ studentId: otherChild.id, fromDate: "2026-12-01", toDate: "2026-12-01", reason: "Sick" }, parentUser(parent.id)),
    ).rejects.toBeInstanceOf(ForbiddenException);

    const req = await service.apply({ studentId: student.id, fromDate: "2026-12-01", toDate: "2026-12-01", reason: "Sick" }, parentUser(parent.id));
    await service.review(req.id, { decision: "REJECTED" }, admin);
    await expect(service.review(req.id, { decision: "APPROVED" }, admin)).rejects.toBeInstanceOf(ConflictException);
    await expect(service.cancel(req.id, parentUser(parent.id))).rejects.toBeInstanceOf(ConflictException);
  });

  it("lets the applicant withdraw a pending request", async () => {
    const base = await makeBase();
    const student = await makeStudent(base);
    const req = await service.apply({ fromDate: "2026-12-20", toDate: "2026-12-21", reason: "Wedding" }, studentUser(student.id));
    expect((await service.cancel(req.id, studentUser(student.id))).status).toBe("CANCELLED");
  });
});
