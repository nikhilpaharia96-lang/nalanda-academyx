export const ROLES = ["SUPER_ADMIN", "ADMIN", "TEACHER", "STUDENT", "PARENT"] as const;
export type Role = (typeof ROLES)[number];

export const USER_STATUSES = ["ACTIVE", "INACTIVE", "SUSPENDED"] as const;
export const STUDENT_STATUSES = ["ACTIVE", "INACTIVE", "GRADUATED", "TRANSFERRED"] as const;

export const ADMISSION_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "PAYMENT_PENDING",
  "PAYMENT_COMPLETED",
  "ENROLLED",
] as const;

export const FEE_FREQUENCIES = ["ONE_TIME", "MONTHLY", "QUARTERLY", "HALF_YEARLY", "YEARLY"] as const;

export const FEE_TYPES = [
  "ADMISSION_FEE",
  "MONTHLY_FEE",
  "ANNUAL_FEE",
  "EXAMINATION_FEE",
  "REGISTRATION_FEE",
  "DEVELOPMENT_FEE",
  "LIBRARY_FEE",
  "TRANSPORT_FEE",
  "OTHER",
] as const;

export const STUDENT_FEE_STATUSES = ["PENDING", "PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELLED", "WAIVED"] as const;

export const OFFLINE_PAYMENT_METHODS = ["CASH", "UPI", "BANK_TRANSFER", "CHEQUE", "OTHER"] as const;

export const PAYMENT_TYPES = ["ADMISSION", "MONTHLY_FEE", "EXTRA_FEE", "OTHER"] as const;
export const PAYMENT_GATEWAYS = [
  "RAZORPAY",
  "OFFLINE_CASH",
  "OFFLINE_UPI",
  "OFFLINE_BANK_TRANSFER",
  "OFFLINE_CHEQUE",
  "OFFLINE_OTHER",
] as const;
export const PAYMENT_STATUSES = ["PENDING", "PROCESSING", "PAID", "FAILED", "CANCELLED", "REFUNDED"] as const;

export const ATTENDANCE_STATUSES = ["PRESENT", "ABSENT", "LATE", "LEAVE"] as const;

export const NOTICE_CATEGORIES = [
  "Admission",
  "Examination",
  "Result",
  "Holiday",
  "Event",
  "General",
  "Important",
] as const;

export const NOTIFICATION_TYPES = [
  "NOTICE",
  "FEE_DUE",
  "PAYMENT",
  "RESULT",
  "EVENT",
  "ATTENDANCE",
  "GENERAL",
] as const;

export const DOCUMENT_VISIBILITY = ["PRIVATE", "SHARED"] as const;

export const EXAM_STATUSES = ["DRAFT", "PUBLISHED"] as const;

// Seeded starting set only — Admin can add further exam types at any time via
// POST /exam-types. This is NOT an exhaustive enum and must never be used to
// validate/restrict the `name` of a new exam type.
export const DEFAULT_EXAM_TYPES = ["Unit Test", "Half-Yearly Examination", "Annual Examination"] as const;
