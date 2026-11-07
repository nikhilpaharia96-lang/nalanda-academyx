import { ConflictException, ForbiddenException } from "@nestjs/common";
import { TransportService } from "./transport.service";
import { AuditService } from "../common/audit.service";
import { OwnershipService } from "../common/ownership.service";
import { admin, makeBase, makeStudent, studentUser } from "../campus.fixtures";

describe("TransportService", () => {
  const service = new TransportService(new AuditService(), new OwnershipService());
  const uid = () => Math.random().toString(36).slice(2, 8);

  it("assigns a student, reports riders, and ends the assignment", async () => {
    const base = await makeBase();
    const student = await makeStudent(base);
    const route = await service.createRoute({ name: `R-${uid()}`, vehicleNumber: "MH12AB1234", driverName: "Ramesh", driverPhone: "9876543210" }, admin.sub);
    const stop = await service.addStop(route.id, { name: "Main Chowk", pickupTime: "07:15", stopOrder: 1 }, admin.sub);
    const a = await service.assign({ studentId: student.id, routeId: route.id, stopId: stop.id }, admin.sub);

    expect((await service.listRoutes()).find((r) => r.id === route.id)).toMatchObject({ riders: 1 });
    expect(await service.forStudent(student.id, studentUser(student.id))).toMatchObject({ routeName: route.name, stopName: "Main Chowk", pickupTime: "07:15" });
    expect(await service.riders(route.id)).toHaveLength(1);

    await service.endAssignment(a.id, admin.sub);
    expect(await service.forStudent(student.id, admin)).toBeNull();
  });

  it("rejects a second active assignment and a stop from another route", async () => {
    const base = await makeBase();
    const student = await makeStudent(base);
    const r1 = await service.createRoute({ name: `R1-${uid()}` }, admin.sub);
    const r2 = await service.createRoute({ name: `R2-${uid()}` }, admin.sub);
    const stopOnR2 = await service.addStop(r2.id, { name: "Depot" }, admin.sub);

    await expect(service.assign({ studentId: student.id, routeId: r1.id, stopId: stopOnR2.id }, admin.sub)).rejects.toBeInstanceOf(ConflictException);
    await service.assign({ studentId: student.id, routeId: r1.id }, admin.sub);
    await expect(service.assign({ studentId: student.id, routeId: r2.id }, admin.sub)).rejects.toBeInstanceOf(ConflictException);
  });

  it("won't delete a stop that students are using, but keeps history once they leave", async () => {
    const base = await makeBase();
    const student = await makeStudent(base);
    const route = await service.createRoute({ name: `R-${uid()}` }, admin.sub);
    const stop = await service.addStop(route.id, { name: "Temple Rd" }, admin.sub);
    const a = await service.assign({ studentId: student.id, routeId: route.id, stopId: stop.id }, admin.sub);
    await expect(service.deleteStop(stop.id, admin.sub)).rejects.toBeInstanceOf(ConflictException);
    await service.endAssignment(a.id, admin.sub);
    await expect(service.deleteStop(stop.id, admin.sub)).resolves.toEqual({ deleted: true });
  });

  it("students can't view another student's route", async () => {
    const base = await makeBase();
    const me = await makeStudent(base, "1");
    const other = await makeStudent(base, "2");
    await expect(service.forStudent(other.id, studentUser(me.id))).rejects.toBeInstanceOf(ForbiddenException);
  });
});
