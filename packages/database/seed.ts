import bcrypt from "bcryptjs";
import { db, schema } from "./index";
import { eq } from "drizzle-orm";

// NOTE: This seed data is clearly demo/development data — marked "(DEMO)" —
// and must never be presented as real Nalanda Academy information.

async function upsertUser(email: string, role: string, passwordHash: string) {
  const existing = await db.select().from(schema.users).where(eq(schema.users.email, email));
  if (existing[0]) return existing[0];
  const [row] = await db.insert(schema.users).values({ email, role, passwordHash, status: "ACTIVE" }).returning();
  return row;
}

async function main() {
  // Refuse to run against a production database by accident. This seed
  // script inserts demo accounts with a shared, documented password — that
  // must never happen against real school data. Set ALLOW_PROD_SEED=true
  // only if you genuinely intend to seed a production-flagged environment
  // (e.g. a freshly provisioned staging DB that happens to have
  // NODE_ENV=production set for other reasons).
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_PROD_SEED !== "true") {
    console.error(
      "Refusing to run the demo seed script with NODE_ENV=production. " +
        "If this is intentional, re-run with ALLOW_PROD_SEED=true.",
    );
    process.exit(1);
  }

  console.log("Seeding Nalanda Academy Cloud demo data...");
  const demoPassword = process.env.SEED_DEMO_PASSWORD || "Passw0rd!Demo";
  const passwordHash = await bcrypt.hash(demoPassword, 10);

  // Academic year
  let [year] = await db.select().from(schema.academicYears).where(eq(schema.academicYears.name, "2026-27"));
  if (!year) {
    [year] = await db.insert(schema.academicYears).values({
      name: "2026-27",
      startDate: "2026-04-01",
      endDate: "2027-03-31",
      active: true,
    }).returning();
  }

  // Classes + sections
  const classNames = ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10"];
  let class10: typeof schema.classes.$inferSelect | undefined;
  let class10SectionA: typeof schema.sections.$inferSelect | undefined;
  for (let i = 0; i < classNames.length; i++) {
    let [cls] = await db.select().from(schema.classes).where(eq(schema.classes.name, classNames[i]));
    if (!cls) {
      [cls] = await db.insert(schema.classes).values({ name: classNames[i], displayOrder: i }).returning();
    }
    for (const sectionName of ["A", "B"]) {
      const existingSections = await db.select().from(schema.sections).where(eq(schema.sections.classId, cls.id));
      if (!existingSections.find((s) => s.name === sectionName)) {
        const [sec] = await db.insert(schema.sections).values({ classId: cls.id, name: sectionName }).returning();
        if (i === classNames.length - 1 && sectionName === "A") class10SectionA = sec;
      } else if (i === classNames.length - 1 && sectionName === "A") {
        class10SectionA = existingSections.find((s) => s.name === sectionName);
      }
    }
    if (i === classNames.length - 1) class10 = cls;
  }
  if (!class10 || !class10SectionA) throw new Error("Seed setup failed: class10 not found");

  // Super Admin
  await upsertUser("admin@nalanda.demo", "SUPER_ADMIN", passwordHash);

  // Teacher
  const teacherUser = await upsertUser("teacher@nalanda.demo", "TEACHER", passwordHash);
  let [teacher] = await db.select().from(schema.teachers).where(eq(schema.teachers.userId, teacherUser.id));
  if (!teacher) {
    [teacher] = await db.insert(schema.teachers).values({
      userId: teacherUser.id,
      employeeId: "EMP-DEMO-001",
      name: "(DEMO) Ananya Sharma",
      subject: "Mathematics",
      department: "Science",
      qualification: "M.Sc. Mathematics, B.Ed.",
      phone: "9000000001",
      email: "teacher@nalanda.demo",
      joiningDate: "2020-06-01",
    }).returning();
    await db.insert(schema.teacherClassAssignments).values({
      teacherId: teacher.id,
      classId: class10.id,
      sectionId: class10SectionA.id,
      subject: "Mathematics",
      academicYearId: year.id,
    });
  }

  // Parent
  const parentUser = await upsertUser("parent@nalanda.demo", "PARENT", passwordHash);
  let [parent] = await db.select().from(schema.parents).where(eq(schema.parents.userId, parentUser.id));
  if (!parent) {
    [parent] = await db.insert(schema.parents).values({
      userId: parentUser.id,
      name: "(DEMO) Rajesh Kumar",
      phone: "9000000002",
      email: "parent@nalanda.demo",
    }).returning();
  }

  // Student
  const studentUser = await upsertUser("student@nalanda.demo", "STUDENT", passwordHash);
  let [student] = await db.select().from(schema.students).where(eq(schema.students.userId, studentUser.id));
  if (!student) {
    [student] = await db.insert(schema.students).values({
      userId: studentUser.id,
      studentId: "STU-DEMO-001",
      admissionNumber: "ADM-DEMO-2026-001",
      name: "(DEMO) Priya Kumar",
      dateOfBirth: "2011-05-14",
      gender: "FEMALE",
      classId: class10.id,
      sectionId: class10SectionA.id,
      academicYearId: year.id,
      rollNumber: "01",
      admissionDate: "2026-04-02",
      address: "(DEMO) 12 Model Colony, Imphal",
    }).returning();

    await db.insert(schema.parentStudents).values({
      parentId: parent.id,
      studentId: student.id,
      relationship: "FATHER",
      isPrimary: true,
    });

    // Fee structure + student fee rows
    const [tuitionFee] = await db.insert(schema.feeStructures).values({
      academicYearId: year.id,
      classId: class10.id,
      feeType: "Tuition",
      amount: 2500,
      frequency: "MONTHLY",
      dueDay: 10,
      description: "(DEMO) Monthly tuition fee — Class 10",
    }).returning();

    for (const month of [4, 5, 6, 7, 8]) {
      await db.insert(schema.studentFees).values({
        studentId: student.id,
        feeStructureId: tuitionFee.id,
        academicYearId: year.id,
        month,
        year: 2026,
        amount: tuitionFee.amount,
        dueDate: `2026-${String(month).padStart(2, "0")}-10`,
        status: month <= 6 ? "PAID" : "PENDING",
      });
    }

    const [resultYear] = await db.select().from(schema.resultYears).where(eq(schema.resultYears.year, 2026));
    let ry = resultYear;
    if (!ry) {
      [ry] = await db.insert(schema.resultYears).values({
        year: 2026,
        academicYearId: year.id,
        totalStudents: 120,
        appeared: 118,
        passed: 112,
        passPercentage: 94.9,
        distinction: 20,
        starMarks: 5,
        published: true,
      }).returning();
    }
    await db.insert(schema.studentResults).values({
      resultYearId: ry.id,
      studentId: student.id,
      studentName: student.name,
      percentage: 91.4,
      grade: "A+",
      achievement: "Distinction",
    });
  }

  // Notices / Events / Faculty / Facilities
  const existingNotice = await db.select().from(schema.notices).where(eq(schema.notices.slug, "demo-admission-open-2026-27"));
  if (!existingNotice[0]) {
    await db.insert(schema.notices).values({
      title: "(DEMO) Admissions Open for 2026-27",
      slug: "demo-admission-open-2026-27",
      content: "(DEMO) This is placeholder notice content for local development.",
      category: "Admission",
      important: true,
      published: true,
      publishedAt: new Date().toISOString(),
      createdBy: "seed-script",
    });
  }

  const existingEvent = await db.select().from(schema.events).where(eq(schema.events.slug, "demo-annual-day-2026"));
  if (!existingEvent[0]) {
    await db.insert(schema.events).values({
      title: "(DEMO) Annual Day 2026",
      slug: "demo-annual-day-2026",
      description: "(DEMO) Placeholder event description for local development.",
      category: "General",
      date: "2026-12-15",
      featured: true,
      published: true,
    });
  }

  const existingFaculty = await db.select().from(schema.faculty);
  if (existingFaculty.length === 0) {
    await db.insert(schema.faculty).values({
      name: "(DEMO) Ananya Sharma",
      designation: "Senior Mathematics Teacher",
      subject: "Mathematics",
      department: "Science",
      qualification: "M.Sc., B.Ed.",
      featured: true,
    });
  }

  const existingFacility = await db.select().from(schema.facilities);
  if (existingFacility.length === 0) {
    await db.insert(schema.facilities).values({
      name: "(DEMO) Science Laboratory",
      description: "(DEMO) Placeholder facility description.",
      displayOrder: 1,
    });
  }

  console.log("Seed complete.");
  console.log("Demo logins (all use the same password):");
  console.log("  admin@nalanda.demo   (SUPER_ADMIN)");
  console.log("  teacher@nalanda.demo (TEACHER)");
  console.log("  student@nalanda.demo (STUDENT)");
  console.log("  parent@nalanda.demo  (PARENT)");
  console.log(`  password: ${demoPassword}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
