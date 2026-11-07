import { ConflictException, ForbiddenException } from "@nestjs/common";
import { TimetableService } from "./timetable.service";
import { AuditService } from "../common/audit.service";
import { OwnershipService } from "../common/ownership.service";
import { admin, makeBase, makeStudent, makeTeacher, studentUser } from "../campus.fixtures";

describe("TimetableService", () => {
  const service = new TimetableService(new AuditService(), new OwnershipService());

  it("creates a slot, sets an entry and replaces it for the same cell", async () => {
    const base = await makeBase();
    const slot = await service.createSlot({ name: `P1-${base.year.id}`, startTime: "09:00", endTime: "09:45" }, admin.sub);
    const dto = {
      classId: base.c1.id, sectionId: base.s1.id, academicYearId: base.year.id,
      timeSlotId: slot.id, dayOfWeek: 1, subjectId: base.subject.id, teacherId: base.teacher.id,
    };
    const first = await service.setEntry(dto, admin.sub);
    const second = await service.setEntry({ ...dto, room: "101" }, admin.sub);
    expect(second.id).toBe(first.id);
    expect(second.room).toBe("101");
    const rows = await service.getForClass(base.c1.id, base.s1.id, base.year.id, admin);
    expect(rows).toHaveLength(1);
    expect(rows[0].subjectName).toBe(base.subject.name);
    expect(rows[0].startTime).toBe("09:00");
  });

  it("rejects a teacher being double-booked in the same slot", async () => {
    const base = await makeBase();
    const slot = await service.createSlot({ name: `P2-${base.year.id}`, startTime: "10:00", endTime: "10:45" }, admin.sub);
    const common = { academicYearId: base.year.id, timeSlotId: slot.id, dayOfWeek: 2, subjectId: base.subject.id, teacherId: base.teacher.id };
    await service.setEntry({ ...common, classId: base.c1.id, sectionId: base.s1.id }, admin.sub);
    await expect(service.setEntry({ ...common, classId: base.c1.id, sectionId: base.s1b.id }, admin.sub)).rejects.toBeInstanceOf(ConflictException);
    // a different teacher is fine
    const other = await makeTeacher();
    await expect(
      service.setEntry({ ...common, teacherId: other.id, classId: base.c1.id, sectionId: base.s1b.id }, admin.sub),
    ).resolves.toBeDefined();
  });

  it("rejects a section that doesn't belong to the class", async () => {
    const base = await makeBase();
    const slot = await service.createSlot({ name: `P3-${base.year.id}`, startTime: "11:00", endTime: "11:45" }, admin.sub);
    await expect(
      service.setEntry(
        { classId: base.c1.id, sectionId: base.s2.id, academicYearId: base.year.id, timeSlotId: slot.id, dayOfWeek: 3, subjectId: base.subject.id },
        admin.sub,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("students see their own class timetable but not another student's", async () => {
    const base = await makeBase();
    const me = await makeStudent(base, "1");
    const other = await makeStudent(base, "2");
    const slot = await service.createSlot({ name: `P4-${base.year.id}`, startTime: "12:00", endTime: "12:45" }, admin.sub);
    await service.setEntry(
      { classId: base.c1.id, sectionId: base.s1.id, academicYearId: base.year.id, timeSlotId: slot.id, dayOfWeek: 4, subjectId: base.subject.id },
      admin.sub,
    );
    expect(await service.getForStudent(me.id, studentUser(me.id))).toHaveLength(1);
    await expect(service.getForStudent(other.id, studentUser(me.id))).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("validates time order on update", async () => {
    const base = await makeBase();
    const slot = await service.createSlot({ name: `P5-${base.year.id}`, startTime: "13:00", endTime: "13:45" }, admin.sub);
    await expect(service.updateSlot(slot.id, { startTime: "14:00" }, admin.sub)).rejects.toBeInstanceOf(ConflictException);
  });
});
