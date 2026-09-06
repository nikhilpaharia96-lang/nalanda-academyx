import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { db, schema } from "@nalanda/database";
import { AuditService } from "../common/audit.service";

const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["SUBMITTED"],
  SUBMITTED: ["UNDER_REVIEW", "REJECTED"],
  UNDER_REVIEW: ["APPROVED", "REJECTED"],
  APPROVED: ["PAYMENT_PENDING"],
  PAYMENT_PENDING: ["PAYMENT_COMPLETED"],
  PAYMENT_COMPLETED: ["ENROLLED"],
  REJECTED: [],
  ENROLLED: [],
};

@Injectable()
export class AdmissionsService {
  constructor(private readonly auditService: AuditService) {}

  list(status?: string) {
    if (status) return db.select().from(schema.admissionApplications).where(eq(schema.admissionApplications.status, status));
    return db.select().from(schema.admissionApplications).orderBy(schema.admissionApplications.createdAt);
  }

  async getById(id: string) {
    const [row] = await db.select().from(schema.admissionApplications).where(eq(schema.admissionApplications.id, id));
    if (!row) throw new NotFoundException("Admission application not found");
    const documents = await db.select().from(schema.admissionDocuments).where(eq(schema.admissionDocuments.applicationId, id));
    return { ...row, documents };
  }

  async create(dto: {
    studentName: string;
    dateOfBirth: string;
    gender: string;
    classId: string;
    previousSchool?: string;
    parentName: string;
    parentPhone: string;
    parentEmail?: string;
    address?: string;
  }) {
    const applicationNumber = `ADM-APP-${new Date().getFullYear()}-${randomBytes(3).toString("hex").toUpperCase()}`;
    const [row] = await db.insert(schema.admissionApplications).values({ applicationNumber, ...dto }).returning();
    await this.auditService.log({ action: "ADMISSION_SUBMIT", entity: "AdmissionApplication", entityId: row.id });
    return row;
  }

  async updateStatus(id: string, newStatus: string, actorId: string) {
    const [existing] = await db.select().from(schema.admissionApplications).where(eq(schema.admissionApplications.id, id));
    if (!existing) throw new NotFoundException("Admission application not found");

    const allowed = VALID_TRANSITIONS[existing.status] || [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(`Cannot transition admission from ${existing.status} to ${newStatus}`);
    }

    const [row] = await db
      .update(schema.admissionApplications)
      .set({ status: newStatus, updatedAt: new Date().toISOString() })
      .where(eq(schema.admissionApplications.id, id))
      .returning();

    await this.auditService.log({
      userId: actorId,
      action: "ADMISSION_STATUS_CHANGE",
      entity: "AdmissionApplication",
      entityId: id,
      description: `${existing.status} -> ${newStatus}`,
    });

    // Enrollment: create the real User + Student records once status hits ENROLLED.
    if (newStatus === "ENROLLED") {
      return this.enroll(row, actorId);
    }
    return row;
  }

  private async enroll(application: typeof schema.admissionApplications.$inferSelect, actorId: string) {
    const email = application.parentEmail || `${application.applicationNumber.toLowerCase()}@placeholder.nalanda.demo`;
    const existingUser = await db.select().from(schema.users).where(eq(schema.users.email, email));
    if (existingUser[0]) {
      throw new BadRequestException("A user with the applicant's email already exists — resolve manually before enrolling");
    }

    const tempPassword = randomBytes(6).toString("base64url");
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    const [user] = await db.insert(schema.users).values({ email, passwordHash, role: "STUDENT" }).returning();

    const [academicYear] = await db.select().from(schema.academicYears).where(eq(schema.academicYears.active, true));
    const [section] = await db.select().from(schema.sections).where(eq(schema.sections.classId, application.classId));
    if (!academicYear || !section) {
      throw new BadRequestException("Cannot enroll: no active academic year or section configured for this class");
    }

    const studentId = `STU-${new Date().getFullYear()}-${randomBytes(3).toString("hex").toUpperCase()}`;
    const admissionNumber = `ADM-${new Date().getFullYear()}-${randomBytes(3).toString("hex").toUpperCase()}`;

    const [student] = await db
      .insert(schema.students)
      .values({
        userId: user.id,
        studentId,
        admissionNumber,
        name: application.studentName,
        dateOfBirth: application.dateOfBirth,
        gender: application.gender,
        classId: application.classId,
        sectionId: section.id,
        academicYearId: academicYear.id,
        rollNumber: "TBD",
        admissionDate: new Date().toISOString().slice(0, 10),
        address: application.address,
      })
      .returning();

    await this.auditService.log({
      userId: actorId,
      action: "ADMISSION_ENROLL",
      entity: "Student",
      entityId: student.id,
      description: `Enrolled from application ${application.applicationNumber}`,
    });

    return { application, student, temporaryPassword: tempPassword };
  }
}
