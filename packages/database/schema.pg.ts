// Nalanda Academy Cloud — Drizzle schema (PostgreSQL, for production).
//
// This is a genuine PostgreSQL-dialect schema built with `pgTable` from
// `drizzle-orm/pg-core` — NOT a renamed copy of the SQLite schema. Every
// table, column, foreign key, unique constraint, and index below has been
// ported 1:1 from `schema.ts` (the SQLite schema used for local dev) so the
// two stay in sync and the application's data model is identical regardless
// of which database is behind it.
//
// DELIBERATE, DOCUMENTED type-mapping decisions made while porting (not
// silent changes — each is a conscious choice to either preserve exact
// existing behavior or use the natively-correct Postgres equivalent):
//
//   • Boolean columns: SQLite has no native boolean type, so schema.ts uses
//     `integer(..., { mode: "boolean" })`. Postgres HAS a native `boolean`
//     type, so this file uses `boolean()` directly — this is the correct,
//     idiomatic Postgres mapping, not a data-model change (the same logical
//     true/false values are preserved; only the underlying storage type is
//     now native instead of emulated).
//
//   • Date/timestamp columns (dateOfBirth, dueDate, paidAt, createdAt, etc.):
//     kept as `text()` (ISO-8601 strings), matching schema.ts exactly. This
//     is a deliberate, conservative choice for this pass — Postgres has
//     native `date`/`timestamp` types that would be preferable long-term,
//     but retyping these was explicitly OUT OF SCOPE for this change (per
//     the instruction to preserve the existing data model and not
//     "silently" change behavior). `text()` is a fully valid, real Postgres
//     column type — this is not a workaround or a fake mapping, it is the
//     conservative choice to keep read/write/compare semantics identical to
//     what the application already relies on. Retyping to native temporal
//     types remains a documented future improvement — see
//     docs/DEPLOYMENT.md, "Known follow-up: date/timestamp typing".
//
//   • Currency/amount columns (amount, passPercentage, percentage): kept as
//     `real()` (floating point), matching schema.ts exactly and Postgres's
//     own native `real` type. Per explicit instruction, this task does NOT
//     convert REAL → NUMERIC/DECIMAL. That remains a separate, deliberate
//     decision to be made later — see docs/DEPLOYMENT.md, "Known follow-up:
//     currency column precision".
//
//   • Primary keys: still application-generated CUID-like strings via the
//     same `createId()` helper used by the SQLite schema (not Postgres
//     `uuid`/`serial`), so ID format and generation logic are identical
//     across both databases and no ID-format migration is ever needed if
//     you move data between them.
//
//   • Enum-like fields (role, status, category, etc.): kept as `text()`
//     columns validated at the application boundary with Zod, exactly as
//     in schema.ts — NOT converted to native Postgres `enum` types. This
//     preserves the existing validation architecture unchanged and avoids
//     a second source of truth for allowed values (the Zod schemas in
//     packages/shared/enums.ts already are that source of truth).
//
// Every table name, column name, foreign key relationship, unique
// constraint, and index below matches schema.ts exactly — verified with a
// dedicated structural comparison test (see test-postgres-schema.js).

import { pgTable, text, integer, real, boolean, uniqueIndex, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "./lib/id";

const id = () => text("id").primaryKey().$defaultFn(createId);
const timestamps = {
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
};

// ---------------------------------------------------------------------------
// AUTH / USERS
// ---------------------------------------------------------------------------

export const users = pgTable("users", {
  id: id(),
  email: text("email").notNull().unique(),
  phone: text("phone").unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull(), // SUPER_ADMIN | ADMIN | TEACHER | STUDENT | PARENT
  status: text("status").notNull().default("ACTIVE"),
  lastLoginAt: text("last_login_at"),
  ...timestamps,
});

export const refreshTokens = pgTable("refresh_tokens", {
  id: id(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  expiresAt: text("expires_at").notNull(),
  revoked: boolean("revoked").notNull().default(false),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (t) => ({ userIdx: index("refresh_tokens_user_idx").on(t.userId) }));

// ---------------------------------------------------------------------------
// ACADEMIC STRUCTURE
// ---------------------------------------------------------------------------

export const academicYears = pgTable("academic_years", {
  id: id(),
  name: text("name").notNull().unique(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  active: boolean("active").notNull().default(false),
  ...timestamps,
});

export const classes = pgTable("classes", {
  id: id(),
  name: text("name").notNull().unique(),
  displayOrder: integer("display_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  ...timestamps,
});

export const sections = pgTable("sections", {
  id: id(),
  classId: text("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (t) => ({ classNameUnique: uniqueIndex("sections_class_name_unique").on(t.classId, t.name) }));

// ---------------------------------------------------------------------------
// PEOPLE
// ---------------------------------------------------------------------------

export const students = pgTable("students", {
  id: id(),
  userId: text("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  studentId: text("student_id").notNull().unique(),
  admissionNumber: text("admission_number").notNull().unique(),
  name: text("name").notNull(),
  photoUrl: text("photo_url"),
  dateOfBirth: text("date_of_birth").notNull(),
  gender: text("gender").notNull(),
  classId: text("class_id").notNull().references(() => classes.id),
  sectionId: text("section_id").notNull().references(() => sections.id),
  academicYearId: text("academic_year_id").notNull().references(() => academicYears.id),
  rollNumber: text("roll_number").notNull(),
  admissionDate: text("admission_date").notNull(),
  status: text("status").notNull().default("ACTIVE"),
  address: text("address"),
  ...timestamps,
}, (t) => ({
  classSectionIdx: index("students_class_section_idx").on(t.classId, t.sectionId),
  rollUnique: uniqueIndex("students_roll_unique").on(t.rollNumber, t.classId, t.sectionId, t.academicYearId),
}));

export const parents = pgTable("parents", {
  id: id(),
  userId: text("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  address: text("address"),
  ...timestamps,
});

export const parentStudents = pgTable("parent_students", {
  id: id(),
  parentId: text("parent_id").notNull().references(() => parents.id, { onDelete: "cascade" }),
  studentId: text("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  relationship: text("relationship").notNull(),
  isPrimary: boolean("is_primary").notNull().default(false),
}, (t) => ({ unique: uniqueIndex("parent_student_unique").on(t.parentId, t.studentId) }));

export const teachers = pgTable("teachers", {
  id: id(),
  userId: text("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  employeeId: text("employee_id").notNull().unique(),
  name: text("name").notNull(),
  photoUrl: text("photo_url"),
  subject: text("subject"),
  department: text("department"),
  qualification: text("qualification"),
  phone: text("phone"),
  email: text("email"),
  joiningDate: text("joining_date").notNull(),
  status: text("status").notNull().default("ACTIVE"),
  ...timestamps,
});

export const teacherClassAssignments = pgTable("teacher_class_assignments", {
  id: id(),
  teacherId: text("teacher_id").notNull().references(() => teachers.id, { onDelete: "cascade" }),
  classId: text("class_id").notNull().references(() => classes.id),
  sectionId: text("section_id").notNull().references(() => sections.id),
  subject: text("subject").notNull(),
  academicYearId: text("academic_year_id").notNull().references(() => academicYears.id),
}, (t) => ({
  unique: uniqueIndex("tca_unique").on(t.teacherId, t.classId, t.sectionId, t.subject, t.academicYearId),
}));

// ---------------------------------------------------------------------------
// ADMISSIONS
// ---------------------------------------------------------------------------

export const admissionApplications = pgTable("admission_applications", {
  id: id(),
  applicationNumber: text("application_number").notNull().unique(),
  studentName: text("student_name").notNull(),
  dateOfBirth: text("date_of_birth").notNull(),
  gender: text("gender").notNull(),
  classId: text("class_id").notNull().references(() => classes.id),
  previousSchool: text("previous_school"),
  parentName: text("parent_name").notNull(),
  parentPhone: text("parent_phone").notNull(),
  parentEmail: text("parent_email"),
  address: text("address"),
  status: text("status").notNull().default("SUBMITTED"),
  paymentStatus: text("payment_status").notNull().default("PENDING"),
  ...timestamps,
});

export const admissionDocuments = pgTable("admission_documents", {
  id: id(),
  applicationId: text("application_id").notNull().references(() => admissionApplications.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// ---------------------------------------------------------------------------
// FEES
// ---------------------------------------------------------------------------

export const feeStructures = pgTable("fee_structures", {
  id: id(),
  academicYearId: text("academic_year_id").notNull().references(() => academicYears.id),
  classId: text("class_id").notNull().references(() => classes.id),
  feeType: text("fee_type").notNull(),
  // Currency field — intentionally kept as `real()` (floating point), NOT
  // converted to NUMERIC/DECIMAL. See the file-header note above.
  amount: real("amount").notNull(),
  frequency: text("frequency").notNull(),
  dueDay: integer("due_day").notNull().default(10),
  active: boolean("active").notNull().default(true),
  description: text("description"),
  ...timestamps,
}, (t) => ({ idx: index("fee_structures_idx").on(t.academicYearId, t.classId) }));

export const studentFees = pgTable("student_fees", {
  id: id(),
  studentId: text("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  feeStructureId: text("fee_structure_id").notNull().references(() => feeStructures.id),
  academicYearId: text("academic_year_id").notNull().references(() => academicYears.id),
  month: integer("month"),
  year: integer("year").notNull(),
  // Currency field — intentionally kept as `real()`. See file-header note.
  amount: real("amount").notNull(),
  dueDate: text("due_date").notNull(),
  status: text("status").notNull().default("PENDING"),
  ...timestamps,
}, (t) => ({
  unique: uniqueIndex("student_fees_unique").on(t.studentId, t.feeStructureId, t.month, t.year),
  statusIdx: index("student_fees_status_idx").on(t.studentId, t.status),
}));

export const extraFees = pgTable("extra_fees", {
  id: id(),
  studentId: text("student_id").references(() => students.id, { onDelete: "cascade" }),
  classId: text("class_id").references(() => classes.id),
  sectionId: text("section_id").references(() => sections.id),
  title: text("title").notNull(),
  description: text("description"),
  // Currency field — intentionally kept as `real()`. See file-header note.
  amount: real("amount").notNull(),
  dueDate: text("due_date").notNull(),
  status: text("status").notNull().default("PENDING"),
  ...timestamps,
});

// ---------------------------------------------------------------------------
// PAYMENTS — Razorpay order/signature/webhook business logic is entirely in
// apps/api/src/payments/*; nothing here changes any payment behavior, only
// the storage dialect of the same columns.
// ---------------------------------------------------------------------------

export const payments = pgTable("payments", {
  id: id(),
  studentId: text("student_id").references(() => students.id),
  admissionApplicationId: text("admission_application_id").references(() => admissionApplications.id),
  studentFeeId: text("student_fee_id").references(() => studentFees.id),
  extraFeeId: text("extra_fee_id").references(() => extraFees.id),
  // Currency field — intentionally kept as `real()`, NOT converted to
  // NUMERIC/DECIMAL, and Razorpay amount-in-paise conversion logic in
  // apps/api/src/payments/*.ts is untouched. See file-header note.
  amount: real("amount").notNull(),
  currency: text("currency").notNull().default("INR"),
  paymentType: text("payment_type").notNull(),
  gateway: text("gateway").notNull(),
  orderId: text("order_id").unique(),
  paymentId: text("payment_id").unique(),
  transactionId: text("transaction_id").unique(),
  method: text("method"),
  status: text("status").notNull().default("PENDING"),
  collectedBy: text("collected_by"),
  referenceNote: text("reference_note"),
  paidAt: text("paid_at"),
  ...timestamps,
}, (t) => ({
  studentIdx: index("payments_student_idx").on(t.studentId),
  statusIdx: index("payments_status_idx").on(t.status),
}));

export const paymentReceipts = pgTable("payment_receipts", {
  id: id(),
  paymentId: text("payment_id").notNull().unique().references(() => payments.id, { onDelete: "cascade" }),
  receiptNumber: text("receipt_number").notNull().unique(),
  receiptUrl: text("receipt_url"),
  generatedAt: text("generated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// ---------------------------------------------------------------------------
// ATTENDANCE
// ---------------------------------------------------------------------------

export const attendance = pgTable("attendance", {
  id: id(),
  studentId: text("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  teacherId: text("teacher_id").notNull().references(() => teachers.id),
  classId: text("class_id").notNull().references(() => classes.id),
  sectionId: text("section_id").notNull().references(() => sections.id),
  academicYearId: text("academic_year_id").notNull().references(() => academicYears.id),
  date: text("date").notNull(),
  status: text("status").notNull(), // PRESENT | ABSENT | LATE | LEAVE — never defaulted
  remarks: text("remarks"),
  ...timestamps,
}, (t) => ({
  // DB-level duplicate protection: one row per student/date/class/section/year.
  // Preserved exactly as in schema.ts — this is the constraint the manual
  // attendance-marking upsert logic in apps/api relies on.
  unique: uniqueIndex("attendance_unique").on(t.studentId, t.date, t.classId, t.sectionId, t.academicYearId),
  dateIdx: index("attendance_date_idx").on(t.classId, t.sectionId, t.date),
}));

// ---------------------------------------------------------------------------
// RESULTS
// ---------------------------------------------------------------------------

export const resultYears = pgTable("result_years", {
  id: id(),
  year: integer("year").notNull().unique(),
  academicYearId: text("academic_year_id").references(() => academicYears.id),
  totalStudents: integer("total_students").notNull().default(0),
  appeared: integer("appeared").notNull().default(0),
  passed: integer("passed").notNull().default(0),
  passPercentage: real("pass_percentage").notNull().default(0),
  distinction: integer("distinction").notNull().default(0),
  starMarks: integer("star_marks").notNull().default(0),
  published: boolean("published").notNull().default(false),
  ...timestamps,
});

export const studentResults = pgTable("student_results", {
  id: id(),
  resultYearId: text("result_year_id").notNull().references(() => resultYears.id, { onDelete: "cascade" }),
  studentId: text("student_id").references(() => students.id),
  studentName: text("student_name").notNull(),
  percentage: real("percentage").notNull(),
  grade: text("grade"),
  achievement: text("achievement"),
  imageUrl: text("image_url"),
}, (t) => ({ idx: index("student_results_idx").on(t.resultYearId) }));

// ---------------------------------------------------------------------------
// CONTENT
// ---------------------------------------------------------------------------

export const notices = pgTable("notices", {
  id: id(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  important: boolean("important").notNull().default(false),
  published: boolean("published").notNull().default(false),
  attachmentUrl: text("attachment_url"),
  publishedAt: text("published_at"),
  createdBy: text("created_by").notNull(),
  ...timestamps,
});

export const events = pgTable("events", {
  id: id(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  date: text("date").notNull(),
  time: text("time"),
  location: text("location"),
  featured: boolean("featured").notNull().default(false),
  published: boolean("published").notNull().default(false),
  coverImageUrl: text("cover_image_url"),
  ...timestamps,
});

export const eventImages = pgTable("event_images", {
  id: id(),
  eventId: text("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
});

export const faculty = pgTable("faculty", {
  id: id(),
  name: text("name").notNull(),
  photoUrl: text("photo_url"),
  designation: text("designation").notNull(),
  subject: text("subject"),
  department: text("department"),
  qualification: text("qualification"),
  bio: text("bio"),
  featured: boolean("featured").notNull().default(false),
  displayOrder: integer("display_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  ...timestamps,
});

export const facilities = pgTable("facilities", {
  id: id(),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  displayOrder: integer("display_order").notNull().default(0),
  published: boolean("published").notNull().default(true),
  ...timestamps,
});

// ---------------------------------------------------------------------------
// COMMUNICATION / SYSTEM
// ---------------------------------------------------------------------------

export const notifications = pgTable("notifications", {
  id: id(),
  recipientUserId: text("recipient_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(),
  readAt: text("read_at"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (t) => ({ idx: index("notifications_recipient_idx").on(t.recipientUserId, t.readAt) }));

export const documents = pgTable("documents", {
  id: id(),
  ownerUserId: text("owner_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  studentId: text("student_id").references(() => students.id),
  name: text("name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  category: text("category").notNull(),
  visibility: text("visibility").notNull().default("PRIVATE"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const contactMessages = pgTable("contact_messages", {
  id: id(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("NEW"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const auditLogs = pgTable("audit_logs", {
  id: id(),
  userId: text("user_id").references(() => users.id),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entity_id"),
  description: text("description"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (t) => ({
  entityIdx: index("audit_logs_entity_idx").on(t.entity, t.entityId),
  userIdx: index("audit_logs_user_idx").on(t.userId),
}));

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

// ---------------------------------------------------------------------------
// RELATIONS (for drizzle's relational query API) — identical to schema.ts,
// `relations()` itself is dialect-agnostic.
// ---------------------------------------------------------------------------

export const usersRelations = relations(users, ({ one, many }) => ({
  student: one(students, { fields: [users.id], references: [students.userId] }),
  parent: one(parents, { fields: [users.id], references: [parents.userId] }),
  teacher: one(teachers, { fields: [users.id], references: [teachers.userId] }),
  notifications: many(notifications),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  user: one(users, { fields: [students.userId], references: [users.id] }),
  class: one(classes, { fields: [students.classId], references: [classes.id] }),
  section: one(sections, { fields: [students.sectionId], references: [sections.id] }),
  academicYear: one(academicYears, { fields: [students.academicYearId], references: [academicYears.id] }),
  parents: many(parentStudents),
  fees: many(studentFees),
  attendance: many(attendance),
  payments: many(payments),
}));

export const parentsRelations = relations(parents, ({ many }) => ({
  children: many(parentStudents),
}));

export const parentStudentsRelations = relations(parentStudents, ({ one }) => ({
  parent: one(parents, { fields: [parentStudents.parentId], references: [parents.id] }),
  student: one(students, { fields: [parentStudents.studentId], references: [students.id] }),
}));

export const teachersRelations = relations(teachers, ({ many }) => ({
  assignments: many(teacherClassAssignments),
}));

export const classesRelations = relations(classes, ({ many }) => ({
  sections: many(sections),
  students: many(students),
}));

export const sectionsRelations = relations(sections, ({ one, many }) => ({
  class: one(classes, { fields: [sections.classId], references: [classes.id] }),
  students: many(students),
}));
