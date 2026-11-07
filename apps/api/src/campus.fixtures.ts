// Shared fixtures for the timetable / library / hostel / promotions specs.
import { db, schema } from "@nalanda/database";

let n = 0;
const uniq = () => `${Date.now().toString(36)}${(n++).toString(36)}`;

export async function makeBase() {
  const u = uniq();
  const [year] = await db.insert(schema.academicYears).values({ name: `Y-${u}`, startDate: "2026-04-01", endDate: "2027-03-31" }).returning();
  const [year2] = await db.insert(schema.academicYears).values({ name: `Y2-${u}`, startDate: "2027-04-01", endDate: "2028-03-31" }).returning();
  const [c1] = await db.insert(schema.classes).values({ name: `C1-${u}` }).returning();
  const [c2] = await db.insert(schema.classes).values({ name: `C2-${u}` }).returning();
  const [s1] = await db.insert(schema.sections).values({ classId: c1.id, name: "A" }).returning();
  const [s1b] = await db.insert(schema.sections).values({ classId: c1.id, name: "B" }).returning();
  const [s2] = await db.insert(schema.sections).values({ classId: c2.id, name: "A" }).returning();
  const [subject] = await db.insert(schema.subjects).values({ name: `Math-${u}` }).returning();
  const teacher = await makeTeacher();
  return { year, year2, c1, c2, s1, s1b, s2, subject, teacher };
}

export async function makeTeacher() {
  const u = uniq();
  const [user] = await db.insert(schema.users).values({ email: `t-${u}@x.test`, passwordHash: "x", role: "TEACHER" }).returning();
  const [teacher] = await db
    .insert(schema.teachers)
    .values({ userId: user.id, employeeId: `E-${u}`, name: `Teacher ${u}`, joiningDate: "2020-01-01" })
    .returning();
  return teacher;
}

export async function makeStudent(base: { year: { id: string }; c1: { id: string }; s1: { id: string } }, roll = "1") {
  const u = uniq();
  const [user] = await db.insert(schema.users).values({ email: `s-${u}@x.test`, passwordHash: "x", role: "STUDENT" }).returning();
  const [student] = await db
    .insert(schema.students)
    .values({
      userId: user.id,
      studentId: `ST-${u}`,
      admissionNumber: `AD-${u}`,
      name: `Student ${u}`,
      dateOfBirth: "2012-01-01",
      gender: "MALE",
      classId: base.c1.id,
      sectionId: base.s1.id,
      academicYearId: base.year.id,
      rollNumber: roll,
      admissionDate: "2024-04-01",
    })
    .returning();
  return student;
}

export const admin = { sub: "admin-1", email: "a@x.test", role: "SUPER_ADMIN" as const };
export const studentUser = (profileId: string) => ({ sub: "u-" + profileId, email: "s@x.test", role: "STUDENT" as const, profileId });
