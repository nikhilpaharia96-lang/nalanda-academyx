import { ConflictException } from "@nestjs/common";
import { HostelService } from "./hostel.service";
import { AuditService } from "../common/audit.service";
import { OwnershipService } from "../common/ownership.service";
import { admin, makeBase, makeStudent } from "../campus.fixtures";

describe("HostelService", () => {
  const service = new HostelService(new AuditService(), new OwnershipService());

  it("allocates, reports occupancy, and vacates", async () => {
    const base = await makeBase();
    const student = await makeStudent(base);
    const hostel = await service.create({ name: `Boys-${base.year.id}`, capacity: 5 }, admin.sub);
    const alloc = await service.allocate({ hostelId: hostel.id, studentId: student.id, roomNumber: "12" }, admin.sub);

    const listed = (await service.list()).find((h) => h.id === hostel.id)!;
    expect(listed.occupied).toBe(1);
    expect(await service.forStudent(student.id, admin)).toMatchObject({ roomNumber: "12", hostelName: hostel.name });

    await service.vacate(alloc.id, admin.sub);
    expect(await service.forStudent(student.id, admin)).toBeNull();
    expect((await service.list()).find((h) => h.id === hostel.id)!.occupied).toBe(0);
  });

  it("blocks a second active allocation and enforces capacity", async () => {
    const base = await makeBase();
    const a = await makeStudent(base, "1");
    const b = await makeStudent(base, "2");
    const hostel = await service.create({ name: `Girls-${base.year.id}`, capacity: 1 }, admin.sub);
    await service.allocate({ hostelId: hostel.id, studentId: a.id, roomNumber: "1" }, admin.sub);
    await expect(service.allocate({ hostelId: hostel.id, studentId: a.id, roomNumber: "2" }, admin.sub)).rejects.toBeInstanceOf(ConflictException);
    await expect(service.allocate({ hostelId: hostel.id, studentId: b.id, roomNumber: "3" }, admin.sub)).rejects.toBeInstanceOf(ConflictException);
  });
});
