import { ForbiddenException } from "@nestjs/common";
import { HomeworkService } from "./homework.service";
import { AuditService } from "../common/audit.service";
import { OwnershipService } from "../common/ownership.service";
import { admin, assignTeacher, makeBase, makeParent, makeStudent, makeTeacher, parentUser, studentUser, teacherUser } from "../campus.fixtures";

describe("HomeworkService", () => {
  const service = new HomeworkService(new AuditService(), new OwnershipService());
  const dto = (base: Awaited<ReturnType<typeof makeBase>>, over = {}) => ({
    classId: base.c1.id, sectionId: base.s1.id, academicYearId: base.year.id, subjectId: base.subject.id,
    title: "Chapter 3 exercises", dueDate: "2026-12-01", ...over,
  });

  it("lets an assigned teacher post, and the class's student and parent see it", async () => {
    const base = await makeBase();
    await assignTeacher(base, base.teacher);
    const student = await makeStudent(base);
    const parent = await makeParent(student);

    const hw = await service.create(dto(base), teacherUser(base.teacher.id));
    expect(hw.teacherId).toBe(base.teacher.id);

    expect((await service.list(studentUser(student.id))).map((h) => h.id)).toContain(hw.id);
    expect((await service.list(parentUser(parent.id), { studentId: student.id })).map((h) => h.id)).toContain(hw.id);
  });

  it("blocks a teacher who isn't assigned to the class", async () => {
    const base = await makeBase();
    const outsider = await makeTeacher();
    await expect(service.create(dto(base), teacherUser(outsider.id))).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("keeps other classes' homework away from students and unlinked parents", async () => {
    const base = await makeBase();
    await assignTeacher(base, base.teacher, base.c2.id, base.s2.id);
    await service.create(dto(base, { classId: base.c2.id, sectionId: base.s2.id }), teacherUser(base.teacher.id));
    const student = await makeStudent(base); // in class 1
    const stranger = await makeParent(await makeStudent(base, "9"));

    expect(await service.list(studentUser(student.id))).toHaveLength(0);
    await expect(service.list(parentUser(stranger.id), { studentId: student.id })).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("only the posting teacher (or an admin) can edit or delete", async () => {
    const base = await makeBase();
    const other = await makeTeacher();
    await assignTeacher(base, base.teacher);
    await assignTeacher(base, other);
    const hw = await service.create(dto(base), teacherUser(base.teacher.id));

    await expect(service.update(hw.id, { title: "Hacked" }, teacherUser(other.id))).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.remove(hw.id, teacherUser(other.id))).rejects.toBeInstanceOf(ForbiddenException);
    expect((await service.update(hw.id, { title: "Updated" }, admin)).title).toBe("Updated");
    await expect(service.remove(hw.id, teacherUser(base.teacher.id))).resolves.toEqual({ deleted: true });
  });
});
