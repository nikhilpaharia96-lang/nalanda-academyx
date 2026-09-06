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
  // Set true whenever the Admin creates an account with a system-generated
  // temporary password, or explicitly resets one. Not enforced as a hard
  // server-side block yet -- surfaced to the client via the login response.
  mustChangePassword: boolean("must_change_password").notNull().default(false),
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
  fatherName: text("father_name"),
  motherName: text("mother_name"),
  phone: text("phone"),
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
  dateOfBirth: text("date_of_birth"),
  gender: text("gender"),
  address: text("address"),
  designation: text("designation"),
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
  // Nullable: a structure with no sectionId applies to every section of the
  // class. Setting it scopes the structure (and everything generated from
  // it) to that one section only.
  sectionId: text("section_id").references(() => sections.id),
  feeType: text("fee_type").notNull(),
  // Currency field — intentionally kept as `real()` (floating point), NOT
  // converted to NUMERIC/DECIMAL. See the file-header note above.
  amount: real("amount").notNull(),
  frequency: text("frequency").notNull(),
  dueDay: integer("due_day").notNull().default(10),
  active: boolean("active").notNull().default(true),
  description: text("description"),
  ...timestamps,
}, (t) => ({ idx: index("fee_structures_idx").on(t.academicYearId, t.classId, t.sectionId) }));

export const studentFees = pgTable("student_fees", {
  id: id(),
  studentId: text("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  feeStructureId: text("fee_structure_id").notNull().references(() => feeStructures.id),
  academicYearId: text("academic_year_id").notNull().references(() => academicYears.id),
  month: integer("month"),
  year: integer("year").notNull(),
  // Currency field — intentionally kept as `real()`. See file-header note.
  amount: real("amount").notNull(),
  // Running total of every PAID payment allocated against this fee. Kept as
  // a denormalized column (rather than always summing `payments` on read) so
  // admin list/report queries stay single-table-scan cheap; it is always
  // recomputed from the payments table inside a transaction in
  // PaymentsService, never incremented blindly, so it can never drift.
  paidAmount: real("paid_amount").notNull().default(0),
  dueDate: text("due_date").notNull(),
  status: text("status").notNull().default("PENDING"),
  waivedAt: text("waived_at"),
  waivedBy: text("waived_by").references(() => users.id),
  waivedReason: text("waived_reason"),
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
  paidAmount: real("paid_amount").notNull().default(0),
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
  // Added for the School Store module — reuses this same payments table and
  // the existing Razorpay create/verify/webhook pipeline rather than a
  // second payment system. Nullable so every existing fee/admission payment
  // row and code path is completely unaffected.
  storeOrderId: text("store_order_id").references((): any => storeOrders.id),
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
  // Free-text name of whoever physically received the money for an offline
  // payment (may differ from the logged-in admin who is data-entering it).
  receivedByName: text("received_by_name"),
  referenceNote: text("reference_note"),
  // Offline cheque-specific detail, only populated for gateway = OFFLINE_CHEQUE.
  chequeNumber: text("cheque_number"),
  bankName: text("bank_name"),
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
// EXAMS & RESULTS
// ---------------------------------------------------------------------------

// A managed, extensible catalog of examination types (Unit Test, Half-Yearly
// Examination, Annual Examination, ...). Admin can add new rows at any time —
// this is intentionally NOT a hard-coded enum, so the set of exam types is
// never limited to whatever ships in the seed data.
export const examTypes = pgTable("exam_types", {
  id: id(),
  name: text("name").notNull().unique(),
  active: boolean("active").notNull().default(true),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// A global subject catalog, analogous to `classes` — reused (not duplicated)
// across teacher assignments' free-text `subject` field is a separate,
// pre-existing concern; this table is the canonical subject list that the
// Exams & Results module links marks to.
export const subjects = pgTable("subjects", {
  id: id(),
  name: text("name").notNull().unique(),
  code: text("code").unique(),
  active: boolean("active").notNull().default(true),
  ...timestamps,
});

// Which subjects are taught in which class — lets the Admin UI offer only
// the subjects relevant to the class currently selected (e.g. Botany for
// B.Sc, not for a primary-school class).
export const classSubjects = pgTable("class_subjects", {
  id: id(),
  classId: text("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
  subjectId: text("subject_id").notNull().references(() => subjects.id, { onDelete: "cascade" }),
  active: boolean("active").notNull().default(true),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (t) => ({ unique: uniqueIndex("class_subjects_unique").on(t.classId, t.subjectId) }));

export const exams = pgTable("exams", {
  id: id(),
  name: text("name").notNull(),
  examTypeId: text("exam_type_id").notNull().references(() => examTypes.id),
  academicYearId: text("academic_year_id").notNull().references(() => academicYears.id),
  classId: text("class_id").notNull().references(() => classes.id),
  // Nullable: an exam may span an entire class (all sections) rather than one section.
  sectionId: text("section_id").references(() => sections.id),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  description: text("description"),
  // DRAFT: invisible to students. PUBLISHED: visible in the Student Portal.
  status: text("status").notNull().default("DRAFT"),
  ...timestamps,
}, (t) => ({
  filterIdx: index("exams_filter_idx").on(t.academicYearId, t.classId, t.sectionId, t.status),
}));

export const examResults = pgTable("exam_results", {
  id: id(),
  examId: text("exam_id").notNull().references(() => exams.id, { onDelete: "cascade" }),
  studentId: text("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  subjectId: text("subject_id").notNull().references(() => subjects.id),
  // Denormalized from the student at entry time (mirrors the `attendance`
  // table's approach) so class/section-wide queries and indexes don't need
  // to join through `students` on every read.
  classId: text("class_id").notNull().references(() => classes.id),
  sectionId: text("section_id").notNull().references(() => sections.id),
  academicYearId: text("academic_year_id").notNull().references(() => academicYears.id),
  maxMarks: real("max_marks").notNull(),
  passMarks: real("pass_marks").notNull(),
  obtainedMarks: real("obtained_marks").notNull(),
  // Server-computed and stored (never trust a client-supplied grade) so
  // reads don't need to recompute, but the frontend can never set these.
  grade: text("grade"),
  passed: boolean("passed").notNull().default(true),
  remarks: text("remarks"),
  enteredBy: text("entered_by").references(() => users.id),
  ...timestamps,
}, (t) => ({
  // Enforces "one result per student+exam+subject" at the DB level.
  unique: uniqueIndex("exam_results_unique").on(t.examId, t.studentId, t.subjectId),
  examClassIdx: index("exam_results_exam_class_idx").on(t.examId, t.classId, t.sectionId),
  studentIdx: index("exam_results_student_idx").on(t.studentId),
}));

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

export const subjectsRelations = relations(subjects, ({ many }) => ({
  classSubjects: many(classSubjects),
}));

export const classSubjectsRelations = relations(classSubjects, ({ one }) => ({
  class: one(classes, { fields: [classSubjects.classId], references: [classes.id] }),
  subject: one(subjects, { fields: [classSubjects.subjectId], references: [subjects.id] }),
}));

export const examTypesRelations = relations(examTypes, ({ many }) => ({
  exams: many(exams),
}));

export const examsRelations = relations(exams, ({ one, many }) => ({
  examType: one(examTypes, { fields: [exams.examTypeId], references: [examTypes.id] }),
  academicYear: one(academicYears, { fields: [exams.academicYearId], references: [academicYears.id] }),
  class: one(classes, { fields: [exams.classId], references: [classes.id] }),
  section: one(sections, { fields: [exams.sectionId], references: [sections.id] }),
  results: many(examResults),
}));

export const examResultsRelations = relations(examResults, ({ one }) => ({
  exam: one(exams, { fields: [examResults.examId], references: [exams.id] }),
  student: one(students, { fields: [examResults.studentId], references: [students.id] }),
  subject: one(subjects, { fields: [examResults.subjectId], references: [subjects.id] }),
}));

// ---------------------------------------------------------------------------
// SCHOOL STORE
// ---------------------------------------------------------------------------
//
// Reuses existing infra rather than inventing parallel systems:
//   - `payments` (above) gained a nullable `storeOrderId` column — store
//     checkouts flow through the exact same Razorpay create/verify/webhook
//     pipeline in apps/api/src/payments/*, not a second one.
//   - `settings` (existing key/value table) holds Store Settings
//     (pickup/delivery availability, contact info, hours, delivery fee) —
//     no new settings table, same pattern the Admin already uses.
//   - Class-wise product targeting joins to the real `classes` table
//     (store_product_classes) rather than a free-text field, since classes
//     already exist as first-class data. "Semester"/"department" are not
//     modeled anywhere in this school's data model (no such entities exist
//     for students), so they are deliberately NOT added here to avoid an
//     unenforceable, purely cosmetic field — class + academic year is the
//     real, working equivalent for this school.
//
// Stock/reservation model: `stockQuantity` is total on-hand stock,
// `reservedQuantity` is stock held against PENDING orders (reserved at order
// creation, released on cancel/expiry, converted to a real deduction on
// payment success). "Available" is always computed as stock - reserved.
// This lives on the product row when a product has no variants, and on the
// variant row when it does (never both) — see `hasVariants` on the product.

export const storeCategories = pgTable("store_categories", {
  id: id(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  icon: text("icon"),
  displayOrder: integer("display_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  ...timestamps,
});

export const storeProducts = pgTable("store_products", {
  id: id(),
  categoryId: text("category_id").notNull().references(() => storeCategories.id),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  sku: text("sku").unique(),
  description: text("description"),
  // Currency fields kept as `real()`, matching every other amount column in
  // this schema (fee_structures.amount, payments.amount, etc.) — see that
  // file-header convention.
  price: real("price").notNull(),
  salePrice: real("sale_price"),
  imageUrl: text("image_url"),
  required: boolean("required").notNull().default(false),
  hasVariants: boolean("has_variants").notNull().default(false),
  // Used only when hasVariants = false. When true, stock lives on
  // store_product_variants instead and these three stay at 0.
  stockQuantity: integer("stock_quantity").notNull().default(0),
  reservedQuantity: integer("reserved_quantity").notNull().default(0),
  lowStockThreshold: integer("low_stock_threshold").notNull().default(5),
  // Optional: ties a product to one academic year (e.g. this year's book
  // list). Null = evergreen (uniforms, stationery, ID cards, etc.).
  academicYearId: text("academic_year_id").references(() => academicYears.id),
  status: text("status").notNull().default("ACTIVE"), // ACTIVE | INACTIVE | ARCHIVED
  ...timestamps,
}, (t) => ({
  categoryIdx: index("store_products_category_idx").on(t.categoryId),
  statusIdx: index("store_products_status_idx").on(t.status),
}));

// Multiple images per product, ordered — mirrors event_images' shape.
export const storeProductImages = pgTable("store_product_images", {
  id: id(),
  productId: text("product_id").notNull().references(() => storeProducts.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
});

// Which classes a product is applicable/required for (many-to-many).
// A product with zero rows here is treated as visible to all classes.
export const storeProductClasses = pgTable("store_product_classes", {
  id: id(),
  productId: text("product_id").notNull().references(() => storeProducts.id, { onDelete: "cascade" }),
  classId: text("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
}, (t) => ({
  unique: uniqueIndex("store_product_classes_unique").on(t.productId, t.classId),
  classIdx: index("store_product_classes_class_idx").on(t.classId),
}));

// Variants (size/color/etc.). `attributes` is a small JSON string like
// {"size":"32","color":"White"} — kept flexible rather than forcing a rigid
// two-column size/color shape, since some products (shoes) only vary by
// size and others (shirts) vary by size AND color.
export const storeProductVariants = pgTable("store_product_variants", {
  id: id(),
  productId: text("product_id").notNull().references(() => storeProducts.id, { onDelete: "cascade" }),
  label: text("label").notNull(), // display label, e.g. "Size 32 / White"
  attributes: text("attributes"), // JSON string, e.g. {"size":"32","color":"White"}
  sku: text("sku").unique(),
  // When null, the parent product's price/salePrice apply unchanged.
  priceOverride: real("price_override"),
  salePriceOverride: real("sale_price_override"),
  stockQuantity: integer("stock_quantity").notNull().default(0),
  reservedQuantity: integer("reserved_quantity").notNull().default(0),
  lowStockThreshold: integer("low_stock_threshold").notNull().default(5),
  active: boolean("active").notNull().default(true),
  ...timestamps,
}, (t) => ({
  productIdx: index("store_product_variants_product_idx").on(t.productId),
}));

// Full audit trail of every stock movement — required for "atomic/
// transaction-safe" inventory per spec §12, and gives Admin real inventory
// history instead of just a current-count snapshot.
export const storeInventoryTransactions = pgTable("store_inventory_transactions", {
  id: id(),
  productId: text("product_id").notNull().references(() => storeProducts.id, { onDelete: "cascade" }),
  variantId: text("variant_id").references(() => storeProductVariants.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // RESTOCK | ADJUSTMENT | RESERVE | RELEASE | SALE | RETURN
  quantityChange: integer("quantity_change").notNull(), // signed
  stockAfter: integer("stock_after").notNull(),
  reservedAfter: integer("reserved_after").notNull(),
  note: text("note"),
  orderId: text("order_id").references((): any => storeOrders.id),
  actorUserId: text("actor_user_id").references(() => users.id),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (t) => ({
  productIdx: index("store_inventory_tx_product_idx").on(t.productId),
}));

// One persistent cart per (user, student) pair — covers both a Student
// shopping for themself and a Parent shopping for a specific selected
// child; reused across sessions and cleared (not deleted) after checkout.
export const storeCarts = pgTable("store_carts", {
  id: id(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  studentId: text("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  ...timestamps,
}, (t) => ({
  unique: uniqueIndex("store_carts_user_student_unique").on(t.userId, t.studentId),
}));

export const storeCartItems = pgTable("store_cart_items", {
  id: id(),
  cartId: text("cart_id").notNull().references(() => storeCarts.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull().references(() => storeProducts.id, { onDelete: "cascade" }),
  variantId: text("variant_id").references(() => storeProductVariants.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(1),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (t) => ({
  cartIdx: index("store_cart_items_cart_idx").on(t.cartId),
}));

export const storeCoupons = pgTable("store_coupons", {
  id: id(),
  code: text("code").notNull().unique(),
  description: text("description"),
  discountType: text("discount_type").notNull(), // PERCENT | FLAT
  discountValue: real("discount_value").notNull(),
  minOrderAmount: real("min_order_amount"),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").notNull().default(0),
  validFrom: text("valid_from"),
  validUntil: text("valid_until"),
  active: boolean("active").notNull().default(true),
  ...timestamps,
});

// Bundles/"complete sets" (spec §16). Data model + basic CRUD ship now;
// "Add complete set to cart" simply fans out into individual store_cart_items
// so real per-product/per-variant inventory logic (reserve/deduct/oversell
// prevention) is never duplicated or faked for bundle purchases.
export const storeBundles = pgTable("store_bundles", {
  id: id(),
  name: text("name").notNull(),
  description: text("description"),
  classId: text("class_id").references(() => classes.id),
  active: boolean("active").notNull().default(true),
  ...timestamps,
});

export const storeBundleItems = pgTable("store_bundle_items", {
  id: id(),
  bundleId: text("bundle_id").notNull().references(() => storeBundles.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull().references(() => storeProducts.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(1),
});

export const storeOrders = pgTable("store_orders", {
  id: id(),
  orderNumber: text("order_number").notNull().unique(),
  userId: text("user_id").notNull().references(() => users.id), // purchaser (student or parent account)
  studentId: text("student_id").notNull().references(() => students.id), // who the order is for
  status: text("status").notNull().default("PENDING"), // PENDING|CONFIRMED|PROCESSING|READY_FOR_COLLECTION|DELIVERED|CANCELLED
  paymentStatus: text("payment_status").notNull().default("PENDING"), // kept in sync with payments.status
  subtotal: real("subtotal").notNull(),
  discountAmount: real("discount_amount").notNull().default(0),
  deliveryFee: real("delivery_fee").notNull().default(0),
  totalAmount: real("total_amount").notNull(),
  couponId: text("coupon_id").references(() => storeCoupons.id),
  fulfillmentMethod: text("fulfillment_method").notNull().default("PICKUP"), // PICKUP | DELIVERY
  contactPhone: text("contact_phone"),
  contactAddress: text("contact_address"),
  notes: text("notes"),
  paymentId: text("payment_id").references(() => payments.id),
  ...timestamps,
}, (t) => ({
  studentIdx: index("store_orders_student_idx").on(t.studentId),
  userIdx: index("store_orders_user_idx").on(t.userId),
  statusIdx: index("store_orders_status_idx").on(t.status),
}));

export const storeOrderItems = pgTable("store_order_items", {
  id: id(),
  orderId: text("order_id").notNull().references(() => storeOrders.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull().references(() => storeProducts.id),
  variantId: text("variant_id").references(() => storeProductVariants.id),
  // Snapshotted at order time so later product edits never rewrite history.
  productName: text("product_name").notNull(),
  variantLabel: text("variant_label"),
  sku: text("sku"),
  unitPrice: real("unit_price").notNull(),
  quantity: integer("quantity").notNull(),
  lineDiscount: real("line_discount").notNull().default(0),
  lineTotal: real("line_total").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (t) => ({
  orderIdx: index("store_order_items_order_idx").on(t.orderId),
}));

// ---------------------------------------------------------------------------
// SCHOOL STORE RELATIONS
// ---------------------------------------------------------------------------

export const storeCategoriesRelations = relations(storeCategories, ({ many }) => ({
  products: many(storeProducts),
}));

export const storeProductsRelations = relations(storeProducts, ({ one, many }) => ({
  category: one(storeCategories, { fields: [storeProducts.categoryId], references: [storeCategories.id] }),
  images: many(storeProductImages),
  variants: many(storeProductVariants),
  classes: many(storeProductClasses),
}));

export const storeProductVariantsRelations = relations(storeProductVariants, ({ one }) => ({
  product: one(storeProducts, { fields: [storeProductVariants.productId], references: [storeProducts.id] }),
}));

export const storeProductClassesRelations = relations(storeProductClasses, ({ one }) => ({
  product: one(storeProducts, { fields: [storeProductClasses.productId], references: [storeProducts.id] }),
  class: one(classes, { fields: [storeProductClasses.classId], references: [classes.id] }),
}));

export const storeCartsRelations = relations(storeCarts, ({ one, many }) => ({
  user: one(users, { fields: [storeCarts.userId], references: [users.id] }),
  student: one(students, { fields: [storeCarts.studentId], references: [students.id] }),
  items: many(storeCartItems),
}));

export const storeCartItemsRelations = relations(storeCartItems, ({ one }) => ({
  cart: one(storeCarts, { fields: [storeCartItems.cartId], references: [storeCarts.id] }),
  product: one(storeProducts, { fields: [storeCartItems.productId], references: [storeProducts.id] }),
  variant: one(storeProductVariants, { fields: [storeCartItems.variantId], references: [storeProductVariants.id] }),
}));

export const storeOrdersRelations = relations(storeOrders, ({ one, many }) => ({
  user: one(users, { fields: [storeOrders.userId], references: [users.id] }),
  student: one(students, { fields: [storeOrders.studentId], references: [students.id] }),
  items: many(storeOrderItems),
  payment: one(payments, { fields: [storeOrders.paymentId], references: [payments.id] }),
}));

export const storeOrderItemsRelations = relations(storeOrderItems, ({ one }) => ({
  order: one(storeOrders, { fields: [storeOrderItems.orderId], references: [storeOrders.id] }),
  product: one(storeProducts, { fields: [storeOrderItems.productId], references: [storeProducts.id] }),
  variant: one(storeProductVariants, { fields: [storeOrderItems.variantId], references: [storeProductVariants.id] }),
}));

export const storeBundlesRelations = relations(storeBundles, ({ many }) => ({
  items: many(storeBundleItems),
}));

export const storeBundleItemsRelations = relations(storeBundleItems, ({ one }) => ({
  bundle: one(storeBundles, { fields: [storeBundleItems.bundleId], references: [storeBundles.id] }),
  product: one(storeProducts, { fields: [storeBundleItems.productId], references: [storeProducts.id] }),
}));
