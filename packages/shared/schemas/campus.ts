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
