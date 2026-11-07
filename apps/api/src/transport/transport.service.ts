import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db, schema } from "@nalanda/database";
import { AuditService } from "../common/audit.service";
import { OwnershipService } from "../common/ownership.service";
import { toFriendlyConflictError } from "../common/db-errors";
import type { AuthenticatedUser } from "../common/types/authenticated-user";

@Injectable()
export class TransportService {
  constructor(
    private readonly auditService: AuditService,
    private readonly ownershipService: OwnershipService,
  ) {}

  /** Routes with their ordered stops and current rider count. */
  async listRoutes() {
    const routes = await db.select().from(schema.transportRoutes).orderBy(schema.transportRoutes.name);
    const stops = await db.select().from(schema.transportStops).orderBy(schema.transportStops.stopOrder, schema.transportStops.pickupTime);
    const counts = await db
      .select({ routeId: schema.transportAssignments.routeId, n: sql<number>`count(*)` })
      .from(schema.transportAssignments)
      .where(isNull(schema.transportAssignments.endedAt))
      .groupBy(schema.transportAssignments.routeId);
    const riders = new Map(counts.map((c) => [c.routeId, Number(c.n)]));
    return routes.map((r) => ({ ...r, riders: riders.get(r.id) ?? 0, stops: stops.filter((s) => s.routeId === r.id) }));
  }

  async createRoute(dto: { name: string; vehicleNumber?: string; driverName?: string; driverPhone?: string; monthlyFee?: number }, actorId: string) {
    try {
      const [row] = await db.insert(schema.transportRoutes).values(dto).returning();
      await this.auditService.log({ userId: actorId, action: "TRANSPORT_ROUTE_CREATE", entity: "TransportRoute", entityId: row.id });
      return row;
    } catch (err) {
      throw toFriendlyConflictError(err, "route name");
    }
  }

  async updateRoute(
    id: string,
    dto: Partial<{ name: string; vehicleNumber: string; driverName: string; driverPhone: string; monthlyFee: number; active: boolean }>,
    actorId: string,
  ) {
    try {
      const [row] = await db
        .update(schema.transportRoutes)
        .set({ ...dto, updatedAt: new Date().toISOString() })
        .where(eq(schema.transportRoutes.id, id))
        .returning();
      if (!row) throw new NotFoundException("Route not found");
      await this.auditService.log({ userId: actorId, action: "TRANSPORT_ROUTE_UPDATE", entity: "TransportRoute", entityId: id });
      return row;
    } catch (err) {
      throw toFriendlyConflictError(err, "route name");
    }
  }

  async addStop(routeId: string, dto: { name: string; pickupTime?: string; stopOrder?: number }, actorId: string) {
    const [route] = await db.select().from(schema.transportRoutes).where(eq(schema.transportRoutes.id, routeId));
    if (!route) throw new NotFoundException("Route not found");
    try {
      const [row] = await db.insert(schema.transportStops).values({ routeId, ...dto }).returning();
      await this.auditService.log({ userId: actorId, action: "TRANSPORT_STOP_CREATE", entity: "TransportStop", entityId: row.id });
      return row;
    } catch (err) {
      throw toFriendlyConflictError(err, "stop name on this route");
    }
  }

  async deleteStop(stopId: string, actorId: string) {
    const [inUse] = await db
      .select()
      .from(schema.transportAssignments)
      .where(and(eq(schema.transportAssignments.stopId, stopId), isNull(schema.transportAssignments.endedAt)));
    if (inUse) throw new ConflictException("Students are currently assigned to this stop; reassign them first");
    // Past (ended) assignments keep history, so detach the stop rather than failing the FK.
    await db.update(schema.transportAssignments).set({ stopId: null }).where(eq(schema.transportAssignments.stopId, stopId));
    const [row] = await db.delete(schema.transportStops).where(eq(schema.transportStops.id, stopId)).returning();
    if (!row) throw new NotFoundException("Stop not found");
    await this.auditService.log({ userId: actorId, action: "TRANSPORT_STOP_DELETE", entity: "TransportStop", entityId: stopId });
    return { deleted: true };
  }

  async assign(dto: { studentId: string; routeId: string; stopId?: string }, actorId: string) {
    const [route] = await db.select().from(schema.transportRoutes).where(eq(schema.transportRoutes.id, dto.routeId));
    if (!route || !route.active) throw new NotFoundException("Route not found");
    const [student] = await db.select().from(schema.students).where(eq(schema.students.id, dto.studentId));
    if (!student) throw new NotFoundException("Student not found");
    if (dto.stopId) {
      const [stop] = await db.select().from(schema.transportStops).where(eq(schema.transportStops.id, dto.stopId));
      if (!stop || stop.routeId !== dto.routeId) throw new ConflictException("Stop does not belong to this route");
    }
    const [current] = await db
      .select()
      .from(schema.transportAssignments)
      .where(and(eq(schema.transportAssignments.studentId, dto.studentId), isNull(schema.transportAssignments.endedAt)));
    if (current) throw new ConflictException("Student already has an active transport assignment; end it first");

    const [row] = await db.insert(schema.transportAssignments).values(dto).returning();
    await this.auditService.log({ userId: actorId, action: "TRANSPORT_ASSIGN", entity: "TransportAssignment", entityId: row.id });
    return row;
  }

  async endAssignment(id: string, actorId: string) {
    const [row] = await db
      .update(schema.transportAssignments)
      .set({ endedAt: new Date().toISOString() })
      .where(and(eq(schema.transportAssignments.id, id), isNull(schema.transportAssignments.endedAt)))
      .returning();
    if (!row) throw new NotFoundException("Active assignment not found");
    await this.auditService.log({ userId: actorId, action: "TRANSPORT_UNASSIGN", entity: "TransportAssignment", entityId: id });
    return row;
  }

  riders(routeId: string) {
    return db
      .select({
        assignmentId: schema.transportAssignments.id,
        studentId: schema.students.id,
        studentName: schema.students.name,
        classId: schema.students.classId,
        sectionId: schema.students.sectionId,
        stopName: schema.transportStops.name,
        pickupTime: schema.transportStops.pickupTime,
      })
      .from(schema.transportAssignments)
      .innerJoin(schema.students, eq(schema.students.id, schema.transportAssignments.studentId))
      .leftJoin(schema.transportStops, eq(schema.transportStops.id, schema.transportAssignments.stopId))
      .where(and(eq(schema.transportAssignments.routeId, routeId), isNull(schema.transportAssignments.endedAt)))
      .orderBy(schema.transportStops.stopOrder, schema.students.name);
  }

  /** A student's current route (null if none). Students see their own; parents their children's. */
  async forStudent(studentId: string, user: AuthenticatedUser) {
    await this.ownershipService.assertCanAccessStudent(studentId, user);
    const [row] = await db
      .select({
        assignmentId: schema.transportAssignments.id,
        routeId: schema.transportRoutes.id,
        routeName: schema.transportRoutes.name,
        vehicleNumber: schema.transportRoutes.vehicleNumber,
        driverName: schema.transportRoutes.driverName,
        driverPhone: schema.transportRoutes.driverPhone,
        stopName: schema.transportStops.name,
        pickupTime: schema.transportStops.pickupTime,
      })
      .from(schema.transportAssignments)
      .innerJoin(schema.transportRoutes, eq(schema.transportRoutes.id, schema.transportAssignments.routeId))
      .leftJoin(schema.transportStops, eq(schema.transportStops.id, schema.transportAssignments.stopId))
      .where(and(eq(schema.transportAssignments.studentId, studentId), isNull(schema.transportAssignments.endedAt)));
    return row ?? null;
  }
}
