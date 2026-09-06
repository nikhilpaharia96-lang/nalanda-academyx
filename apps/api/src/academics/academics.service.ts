import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { db, schema } from "@nalanda/database";
import { AuditService } from "../common/audit.service";

@Injectable()
export class AcademicsService {
  constructor(private readonly auditService: AuditService) {}

  // --- Academic Years -----------------------------------------------------
  listAcademicYears() {
    return db.select().from(schema.academicYears).orderBy(schema.academicYears.startDate);
  }

  async createAcademicYear(data: { name: string; startDate: string; endDate: string; active?: boolean }, actorId: string) {
    const existing = await db.select().from(schema.academicYears).where(eq(schema.academicYears.name, data.name));
    if (existing[0]) throw new ConflictException("An academic year with this name already exists");
    const [row] = await db.insert(schema.academicYears).values(data).returning();
    await this.auditService.log({ userId: actorId, action: "ACADEMIC_YEAR_CREATE", entity: "AcademicYear", entityId: row.id });
    return row;
  }

  async updateAcademicYear(id: string, data: Partial<{ name: string; startDate: string; endDate: string; active: boolean }>, actorId: string) {
    const [existing] = await db.select().from(schema.academicYears).where(eq(schema.academicYears.id, id));
    if (!existing) throw new NotFoundException("Academic year not found");
    const [row] = await db
      .update(schema.academicYears)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(schema.academicYears.id, id))
      .returning();
    await this.auditService.log({ userId: actorId, action: "ACADEMIC_YEAR_UPDATE", entity: "AcademicYear", entityId: id });
    return row;
  }

  // --- Classes -------------------------------------------------------------
  listClasses() {
    return db.select().from(schema.classes).orderBy(schema.classes.displayOrder);
  }

  async createClass(data: { name: string; displayOrder?: number }, actorId: string) {
    const existing = await db.select().from(schema.classes).where(eq(schema.classes.name, data.name));
    if (existing[0]) throw new ConflictException("A class with this name already exists");
    const [row] = await db.insert(schema.classes).values(data).returning();
    await this.auditService.log({ userId: actorId, action: "CLASS_CREATE", entity: "Class", entityId: row.id });
    return row;
  }

  async updateClass(id: string, data: Partial<{ name: string; displayOrder: number; active: boolean }>, actorId: string) {
    const [existing] = await db.select().from(schema.classes).where(eq(schema.classes.id, id));
    if (!existing) throw new NotFoundException("Class not found");
    const [row] = await db
      .update(schema.classes)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(schema.classes.id, id))
      .returning();
    await this.auditService.log({ userId: actorId, action: "CLASS_UPDATE", entity: "Class", entityId: id });
    return row;
  }

  // --- Sections --------------------------------------------------------------
  listSections(classId?: string) {
    if (classId) return db.select().from(schema.sections).where(eq(schema.sections.classId, classId));
    return db.select().from(schema.sections);
  }

  async createSection(data: { classId: string; name: string }, actorId: string) {
    const [cls] = await db.select().from(schema.classes).where(eq(schema.classes.id, data.classId));
    if (!cls) throw new NotFoundException("Class not found");
    const existing = await db
      .select()
      .from(schema.sections)
      .where(eq(schema.sections.classId, data.classId));
    if (existing.find((s) => s.name === data.name)) throw new ConflictException("Section already exists for this class");
    const [row] = await db.insert(schema.sections).values(data).returning();
    await this.auditService.log({ userId: actorId, action: "SECTION_CREATE", entity: "Section", entityId: row.id });
    return row;
  }

  async updateSection(id: string, data: Partial<{ name: string; active: boolean }>, actorId: string) {
    const [existing] = await db.select().from(schema.sections).where(eq(schema.sections.id, id));
    if (!existing) throw new NotFoundException("Section not found");
    const [row] = await db.update(schema.sections).set(data).where(eq(schema.sections.id, id)).returning();
    await this.auditService.log({ userId: actorId, action: "SECTION_UPDATE", entity: "Section", entityId: id });
    return row;
  }
}
