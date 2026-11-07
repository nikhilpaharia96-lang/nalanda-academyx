import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db, schema } from "@nalanda/database";
import { AuditService } from "../common/audit.service";
import { OwnershipService } from "../common/ownership.service";
import { toFriendlyConflictError } from "../common/db-errors";
import type { AuthenticatedUser } from "../common/types/authenticated-user";

@Injectable()
export class HostelService {
  constructor(
    private readonly auditService: AuditService,
    private readonly ownershipService: OwnershipService,
  ) {}

  /** Each hostel with its current number of residents. */
  async list() {
    const hostels = await db.select().from(schema.hostels).orderBy(schema.hostels.name);
    const counts = await db
      .select({ hostelId: schema.hostelAllocations.hostelId, n: sql<number>`count(*)` })
      .from(schema.hostelAllocations)
      .where(isNull(schema.hostelAllocations.vacatedAt))
      .groupBy(schema.hostelAllocations.hostelId);
    const byHostel = new Map(counts.map((c) => [c.hostelId, Number(c.n)]));
    return hostels.map((h) => ({ ...h, occupied: byHostel.get(h.id) ?? 0 }));
  }

  async create(dto: { name: string; description?: string; capacity?: number }, actorId: string) {
    try {
      const [row] = await db.insert(schema.hostels).values(dto).returning();
      await this.auditService.log({ userId: actorId, action: "HOSTEL_CREATE", entity: "Hostel", entityId: row.id });
      return row;
    } catch (err) {
      throw toFriendlyConflictError(err, "name");
    }
  }

  async update(
    id: string,
    dto: Partial<{ name: string; description: string; capacity: number; active: boolean }>,
    actorId: string,
  ) {
    try {
      const [row] = await db
        .update(schema.hostels)
        .set({ ...dto, updatedAt: new Date().toISOString() })
        .where(eq(schema.hostels.id, id))
        .returning();
      if (!row) throw new NotFoundException("Hostel not found");
      await this.auditService.log({ userId: actorId, action: "HOSTEL_UPDATE", entity: "Hostel", entityId: id });
      return row;
    } catch (err) {
      throw toFriendlyConflictError(err, "name");
    }
  }

  async allocate(dto: { hostelId: string; studentId: string; roomNumber: string }, actorId: string) {
    const [hostel] = await db.select().from(schema.hostels).where(eq(schema.hostels.id, dto.hostelId));
    if (!hostel || !hostel.active) throw new NotFoundException("Hostel not found");
    const [student] = await db.select().from(schema.students).where(eq(schema.students.id, dto.studentId));
    if (!student) throw new NotFoundException("Student not found");

    const [current] = await db
      .select()
      .from(schema.hostelAllocations)
      .where(and(eq(schema.hostelAllocations.studentId, dto.studentId), isNull(schema.hostelAllocations.vacatedAt)));
    if (current) throw new ConflictException("Student already has an active hostel allocation; vacate it first");

    if (hostel.capacity) {
      const [{ n }] = await db
        .select({ n: sql<number>`count(*)` })
        .from(schema.hostelAllocations)
        .where(and(eq(schema.hostelAllocations.hostelId, dto.hostelId), isNull(schema.hostelAllocations.vacatedAt)));
      if (Number(n) >= hostel.capacity) throw new ConflictException("This hostel is at full capacity");
    }

    const [row] = await db.insert(schema.hostelAllocations).values(dto).returning();
    await this.auditService.log({ userId: actorId, action: "HOSTEL_ALLOCATE", entity: "HostelAllocation", entityId: row.id });
    return row;
  }

  async vacate(allocationId: string, actorId: string) {
    const [row] = await db
      .update(schema.hostelAllocations)
      .set({ vacatedAt: new Date().toISOString() })
      .where(and(eq(schema.hostelAllocations.id, allocationId), isNull(schema.hostelAllocations.vacatedAt)))
      .returning();
    if (!row) throw new NotFoundException("Active allocation not found");
    await this.auditService.log({ userId: actorId, action: "HOSTEL_VACATE", entity: "HostelAllocation", entityId: allocationId });
    return row;
  }

  residents(hostelId: string) {
    return db
      .select({
        allocationId: schema.hostelAllocations.id,
        roomNumber: schema.hostelAllocations.roomNumber,
        allocatedAt: schema.hostelAllocations.allocatedAt,
        studentId: schema.students.id,
        studentName: schema.students.name,
        classId: schema.students.classId,
        sectionId: schema.students.sectionId,
      })
      .from(schema.hostelAllocations)
      .innerJoin(schema.students, eq(schema.students.id, schema.hostelAllocations.studentId))
      .where(and(eq(schema.hostelAllocations.hostelId, hostelId), isNull(schema.hostelAllocations.vacatedAt)))
      .orderBy(schema.hostelAllocations.roomNumber);
  }

  /** Current allocation for a student (null if none) — students see their own, parents their children's. */
  async forStudent(studentId: string, user: AuthenticatedUser) {
    await this.ownershipService.assertCanAccessStudent(studentId, user);
    const [row] = await db
      .select({
        allocationId: schema.hostelAllocations.id,
        roomNumber: schema.hostelAllocations.roomNumber,
        allocatedAt: schema.hostelAllocations.allocatedAt,
        hostelId: schema.hostels.id,
        hostelName: schema.hostels.name,
      })
      .from(schema.hostelAllocations)
      .innerJoin(schema.hostels, eq(schema.hostels.id, schema.hostelAllocations.hostelId))
      .where(and(eq(schema.hostelAllocations.studentId, studentId), isNull(schema.hostelAllocations.vacatedAt)));
    return row ?? null;
  }
}
