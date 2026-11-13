import { z } from "zod";
import { BOOK_REQUEST_STATUSES, PROMOTION_OUTCOMES } from "../enums";

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM (24h)");

// --- Timetable -------------------------------------------------------------
export const timeSlotSchema = z
  .object({
    name: z.string().min(1),
    startTime: hhmm,
    endTime: hhmm,
    displayOrder: z.number().int().optional(),
  })
  .refine((v) => v.startTime < v.endTime, { message: "endTime must be after startTime", path: ["endTime"] });
export const timeSlotUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  startTime: hhmm.optional(),
  endTime: hhmm.optional(),
  displayOrder: z.number().int().optional(),
  active: z.boolean().optional(),
});

export const timetableEntrySchema = z.object({
  classId: z.string().min(1),
  sectionId: z.string().min(1),
  academicYearId: z.string().min(1),
  timeSlotId: z.string().min(1),
  dayOfWeek: z.number().int().min(1).max(7),
  subjectId: z.string().min(1),
  teacherId: z.string().min(1).optional(),
  room: z.string().optional(),
});
export type TimetableEntryDto = z.infer<typeof timetableEntrySchema>;

// --- Library ---------------------------------------------------------------
export const bookSchema = z.object({
  title: z.string().min(1),
  author: z.string().optional(),
  isbn: z.string().min(5).optional(),
  category: z.string().optional(),
  location: z.string().optional(),
  totalCopies: z.number().int().min(1).default(1),
});
export const bookUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  author: z.string().optional(),
  isbn: z.string().min(5).optional(),
  category: z.string().optional(),
  location: z.string().optional(),
  totalCopies: z.number().int().min(1).optional(),
  active: z.boolean().optional(),
});
export const bookRequestCreateSchema = z.object({
  bookId: z.string().min(1),
  // Students request for themselves (ignored); admins must name the student.
  studentId: z.string().min(1).optional(),
  remarks: z.string().optional(),
});
export const bookIssueSchema = z.object({ dueDate: z.string().date() });
export const bookRequestStatusFilter = z.enum(BOOK_REQUEST_STATUSES);

// --- Hostel ----------------------------------------------------------------
export const hostelSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  capacity: z.number().int().min(1).optional(),
});
export const hostelUpdateSchema = hostelSchema.partial().extend({ active: z.boolean().optional() });
export const hostelAllocateSchema = z.object({
  hostelId: z.string().min(1),
  studentId: z.string().min(1),
  roomNumber: z.string().min(1),
});

// --- Promotions ------------------------------------------------------------
export const promoteSchema = z.object({
  fromAcademicYearId: z.string().min(1),
  toAcademicYearId: z.string().min(1),
  items: z
    .array(
      z.object({
        studentId: z.string().min(1),
        outcome: z.enum(PROMOTION_OUTCOMES),
        toClassId: z.string().min(1).optional(),
        toSectionId: z.string().min(1).optional(),
        rollNumber: z.string().min(1).optional(),
      }),
    )
    .min(1)
    .max(500),
});
export type PromoteDto = z.infer<typeof promoteSchema>;

// --- Transport ---------------------------------------------------------------
const optHhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM (24h)").optional();
export const transportRouteSchema = z.object({
  name: z.string().min(1),
  vehicleNumber: z.string().optional(),
  driverName: z.string().optional(),
  driverPhone: z.string().optional(),
  monthlyFee: z.number().nonnegative().optional(),
});
export const transportRouteUpdateSchema = transportRouteSchema.partial().extend({ active: z.boolean().optional() });
export const transportStopSchema = z.object({
  name: z.string().min(1),
  pickupTime: optHhmm,
  stopOrder: z.number().int().min(0).optional(),
});
export const transportAssignSchema = z.object({
  studentId: z.string().min(1),
  routeId: z.string().min(1),
  stopId: z.string().min(1).optional(),
});

// --- Homework ------------------------------------------------------------------
export const homeworkSchema = z.object({
  classId: z.string().min(1),
  sectionId: z.string().min(1),
  academicYearId: z.string().min(1),
  subjectId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  dueDate: z.string().date(),
});
export const homeworkUpdateSchema = z.object({
  subjectId: z.string().min(1).optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  dueDate: z.string().date().optional(),
});

// --- Leave requests ---------------------------------------------------------------
export const leaveApplySchema = z.object({
  studentId: z.string().min(1).optional(), // required for parents/admins, ignored for students
  fromDate: z.string().date(),
  toDate: z.string().date(),
  reason: z.string().min(3).max(1000),
});
export const leaveReviewSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  note: z.string().max(500).optional(),
});

// --- Certificates ----------------------------------------------------------------------
export const issueCertificateSchema = z.object({
  type: z.enum(["BONAFIDE", "TRANSFER", "CHARACTER"]),
  studentId: z.string().min(1),
  purpose: z.string().max(200).optional(), // bonafide
  reason: z.string().max(300).optional(), // TC: reason for leaving
  conduct: z.string().max(100).optional(), // TC / character
  dateOfLeaving: z.string().date().optional(), // required for TC
  remarks: z.string().max(300).optional(),
  // TC only: also mark the student TRANSFERRED and end hostel/transport allocations.
  markStudentLeft: z.boolean().optional(),
});
export type IssueCertificateDto = z.infer<typeof issueCertificateSchema>;
export const cancelCertificateSchema = z.object({ reason: z.string().min(3).max(300) });

// --- Fee concessions -------------------------------------------------------------------------
export const concessionSchema = z
  .object({
    name: z.string().min(2).max(80),
    type: z.enum(["PERCENT", "FLAT"]),
    value: z.number().positive(),
    feeType: z.string().min(1).optional(), // omit = applies to every fee type
    description: z.string().max(300).optional(),
  })
  .refine((v) => v.type !== "PERCENT" || v.value <= 100, { message: "A percentage cannot exceed 100", path: ["value"] });
export const concessionUpdateSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  value: z.number().positive().optional(),
  feeType: z.string().min(1).nullable().optional(),
  description: z.string().max(300).optional(),
  active: z.boolean().optional(),
});
export const grantConcessionSchema = z.object({
  studentId: z.string().min(1),
  concessionId: z.string().min(1),
  academicYearId: z.string().min(1),
  reason: z.string().min(3).max(300),
  // Also discount this student's already-generated fees that are completely unpaid.
  applyToExisting: z.boolean().optional(),
});

// --- Staff payroll & attendance -----------------------------------------------------------------------
const money = z.number().min(0).max(10_000_000);
export const salaryStructureSchema = z.object({
  basic: z.number().positive().max(10_000_000),
  hra: money.default(0),
  da: money.default(0),
  otherAllowances: money.default(0),
  pfPercent: z.number().min(0).max(100).default(0),
  professionalTax: money.default(0),
  otherDeductions: money.default(0),
});
export const staffAttendanceSchema = z.object({
  date: z.string().date(),
  records: z.array(z.object({
    teacherId: z.string().min(1),
    status: z.enum(["PRESENT", "ABSENT", "HALF_DAY", "LEAVE"]),
    note: z.string().max(200).optional(),
  })).min(1).max(500),
});
export const generatePayslipsSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
});
export const adjustPayslipSchema = z.object({ lopDays: z.number().min(0).max(31) });
export const payPayslipSchema = z.object({
  paidOn: z.string().date(),
  paymentMode: z.enum(["CASH", "UPI", "BANK_TRANSFER", "CHEQUE", "OTHER"]),
  paymentReference: z.string().max(100).optional(),
});
