import bcrypt from "bcryptjs";
import { db, schema } from "./index";
import { and, eq } from "drizzle-orm";

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

  // Exams & Results demo data ------------------------------------------------
  // A second student in the same class/section, so bulk marks entry and
  // class-topper/failure scenarios both have something to show.
  const student2User = await upsertUser("student2@nalanda.demo", "STUDENT", passwordHash);
  let [student2] = await db.select().from(schema.students).where(eq(schema.students.userId, student2User.id));
  if (!student2) {
    [student2] = await db
      .insert(schema.students)
      .values({
        userId: student2User.id,
        studentId: "STU-DEMO-002",
        admissionNumber: "ADM-DEMO-2026-002",
        name: "(DEMO) Rahul Sharma",
        dateOfBirth: "2011-08-22",
        gender: "MALE",
        classId: class10.id,
        sectionId: class10SectionA.id,
        academicYearId: year.id,
        rollNumber: "02",
        admissionDate: "2026-04-02",
      })
      .returning();
  }

  for (const name of ["Unit Test", "Half-Yearly Examination", "Annual Examination"]) {
    const [existing] = await db.select().from(schema.examTypes).where(eq(schema.examTypes.name, name));
    if (!existing) await db.insert(schema.examTypes).values({ name });
  }
  const [unitTestType] = await db.select().from(schema.examTypes).where(eq(schema.examTypes.name, "Unit Test"));

  const subjectNames = ["Mathematics", "English", "Science"];
  const subjectByName = new Map<string, typeof schema.subjects.$inferSelect>();
  for (const name of subjectNames) {
    let [subject] = await db.select().from(schema.subjects).where(eq(schema.subjects.name, name));
    if (!subject) [subject] = await db.insert(schema.subjects).values({ name }).returning();
    subjectByName.set(name, subject);
    const [link] = await db
      .select()
      .from(schema.classSubjects)
      .where(and(eq(schema.classSubjects.classId, class10.id), eq(schema.classSubjects.subjectId, subject.id)));
    if (!link) await db.insert(schema.classSubjects).values({ classId: class10.id, subjectId: subject.id });
  }

  let [demoExam] = await db.select().from(schema.exams).where(eq(schema.exams.name, "(DEMO) Unit Test 1"));
  if (!demoExam) {
    [demoExam] = await db
      .insert(schema.exams)
      .values({
        name: "(DEMO) Unit Test 1",
        examTypeId: unitTestType.id,
        academicYearId: year.id,
        classId: class10.id,
        sectionId: class10SectionA.id,
        startDate: "2026-07-01",
        endDate: "2026-07-05",
        description: "(DEMO) Demonstrates the Exams & Results module end-to-end.",
        status: "PUBLISHED",
      })
      .returning();

    const marks: [typeof student, string, number, number][] = [
      [student, "Mathematics", 78, 100],
      [student, "English", 85, 100],
      [student, "Science", 74, 100],
      [student2, "Mathematics", 35, 100],
      [student2, "English", 61, 100],
      [student2, "Science", 55, 100],
    ];
    for (const [s, subjectName, obtained, max] of marks) {
      const subject = subjectByName.get(subjectName)!;
      const passMarks = 40;
      const passed = obtained >= passMarks;
      const percentage = (obtained / max) * 100;
      const grade = !passed ? "F" : percentage >= 90 ? "A+" : percentage >= 80 ? "A" : percentage >= 70 ? "B+" : percentage >= 60 ? "B" : percentage >= 50 ? "C" : "D";
      await db.insert(schema.examResults).values({
        examId: demoExam.id,
        studentId: s.id,
        subjectId: subject.id,
        classId: s.classId,
        sectionId: s.sectionId,
        academicYearId: year.id,
        maxMarks: max,
        passMarks,
        obtainedMarks: obtained,
        grade,
        passed,
        remarks: passed ? "Good performance." : "Needs improvement — please meet the subject teacher.",
      });
    }
  }

  // Notices — a realistic, varied set so "07 Latest Notices" on the public
  // site has real content immediately after seeding. Dates are relative to
  // "today" so they stay newest-first-sensible however far in the future
  // this seed is run.
  const noticeSeeds = [
    {
      slug: "demo-admission-open-2026-27",
      title: "(DEMO) Admissions Open for 2026-27",
      content: "(DEMO) Applications for the 2026-27 academic year are now open. Interested parents can apply online or collect the form from the front office.",
      category: "Admission",
      important: true,
      published: true,
      noticeDaysFromNow: -2,
      ctaText: "Apply Online",
      externalLink: "https://example.com/admissions/apply",
      displayOrder: 0,
    },
    {
      slug: "demo-half-yearly-datesheet-2026",
      title: "(DEMO) Half-Yearly Examination Datesheet Released",
      content: "(DEMO) The datesheet for the half-yearly examinations (Classes I-XII) has been released. Please download the attached circular for subject-wise timings.",
      category: "Examination",
      important: true,
      published: true,
      noticeDaysFromNow: -1,
      attachmentUrl: "https://example.com/documents/half-yearly-datesheet-2026.pdf",
      ctaText: "Download Datesheet",
      displayOrder: 1,
    },
    {
      slug: "demo-winter-break-holiday-2026",
      title: "(DEMO) Winter Break Holiday Notice",
      content: "(DEMO) The school will remain closed for winter break. Classes resume as per the academic calendar shared with parents.",
      category: "Holiday",
      important: false,
      published: true,
      noticeDaysFromNow: 0,
      displayOrder: 2,
    },
    {
      slug: "demo-result-declaration-upcoming",
      title: "(DEMO) Draft: Result Declaration Schedule (not yet published)",
      content: "(DEMO) Draft notice for the upcoming result declaration schedule — intentionally left unpublished to demonstrate the admin draft workflow.",
      category: "Result",
      important: false,
      published: false,
      noticeDaysFromNow: 3,
      displayOrder: 3,
    },
  ] as const;

  for (const n of noticeSeeds) {
    const existing = await db.select().from(schema.notices).where(eq(schema.notices.slug, n.slug));
    if (existing[0]) continue;
    const noticeDate = new Date(Date.now() + n.noticeDaysFromNow * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    await db.insert(schema.notices).values({
      title: n.title,
      slug: n.slug,
      content: n.content,
      category: n.category,
      important: n.important,
      published: n.published,
      publishedAt: n.published ? new Date().toISOString() : null,
      noticeDate,
      attachmentUrl: "attachmentUrl" in n ? n.attachmentUrl : undefined,
      externalLink: "externalLink" in n ? n.externalLink : undefined,
      ctaText: n.ctaText,
      displayOrder: n.displayOrder,
      createdBy: "seed-script",
    });
  }

  // Events — a realistic, varied set for "06 Upcoming Events" on the public
  // site. Dates are relative to "today" so at least a few are always in the
  // future regardless of when the seed is run.
  const eventSeeds = [
    {
      slug: "demo-annual-day-2026",
      title: "(DEMO) Annual Day 2026",
      description: "(DEMO) An evening of music, dance and drama celebrating the achievements of our students, followed by the annual prize distribution.",
      category: "General",
      dateDaysFromNow: 21,
      time: "17:00",
      endTime: "20:00",
      location: "School Auditorium",
      featured: true,
      published: true,
      registrationUrl: "https://example.com/events/annual-day-2026/rsvp",
      ctaText: "RSVP Now",
      displayOrder: 0,
    },
    {
      slug: "demo-science-exhibition-2026",
      title: "(DEMO) Inter-School Science Exhibition",
      description: "(DEMO) Students from Classes VI-XII showcase working models and research projects across physics, chemistry, biology and environmental science.",
      category: "Academic",
      dateDaysFromNow: 10,
      time: "09:00",
      endTime: "13:00",
      location: "Senior Block, Ground Floor",
      featured: false,
      published: true,
      ctaText: "Learn More",
      displayOrder: 1,
    },
    {
      slug: "demo-annual-sports-day-2026",
      title: "(DEMO) Annual Sports Day",
      description: "(DEMO) Track and field events, relay races and the much-awaited parents' race, capped off with the closing ceremony.",
      category: "Sports",
      dateDaysFromNow: 35,
      time: "08:00",
      endTime: "14:00",
      location: "School Sports Ground",
      featured: true,
      published: true,
      registrationUrl: "https://example.com/events/sports-day-2026/register",
      ctaText: "Register to Participate",
      displayOrder: 2,
    },
    {
      slug: "demo-alumni-meet-draft",
      title: "(DEMO) Draft: Alumni Meet (not yet published)",
      description: "(DEMO) Draft event for a planned alumni get-together — intentionally left unpublished to demonstrate the admin draft workflow.",
      category: "Community",
      dateDaysFromNow: 60,
      location: "School Campus",
      featured: false,
      published: false,
      displayOrder: 3,
    },
  ] as const;

  for (const e of eventSeeds) {
    const existing = await db.select().from(schema.events).where(eq(schema.events.slug, e.slug));
    if (existing[0]) continue;
    const date = new Date(Date.now() + e.dateDaysFromNow * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    await db.insert(schema.events).values({
      title: e.title,
      slug: e.slug,
      description: e.description,
      category: e.category,
      date,
      time: "time" in e ? e.time : undefined,
      endTime: "endTime" in e ? e.endTime : undefined,
      location: e.location,
      featured: e.featured,
      published: e.published,
      registrationUrl: "registrationUrl" in e ? e.registrationUrl : undefined,
      ctaText: "ctaText" in e ? e.ctaText : undefined,
      displayOrder: e.displayOrder,
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
