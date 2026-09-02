import { z } from "zod";
import { STUDENT_STATUSES } from "../enums";

export const createStudentSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).optional(), // if omitted, a temp password is generated
  name: z.string().min(2),
  dateOfBirth: z.string().date(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  classId: z.string().min(1),
  sectionId: z.string().min(1),
  academicYearId: z.string().min(1),
  rollNumber: z.string().min(1),
  admissionDate: z.string().date(),
  address: z.string().optional(),
});
export type CreateStudentDto = z.infer<typeof createStudentSchema>;

export const updateStudentSchema = z.object({
  name: z.string().min(2).optional(),
  classId: z.string().optional(),
  sectionId: z.string().optional(),
  rollNumber: z.string().optional(),
  status: z.enum(STUDENT_STATUSES).optional(),
  address: z.string().optional(),
  photoUrl: z.string().url().optional(),
});
export type UpdateStudentDto = z.infer<typeof updateStudentSchema>;

export const listStudentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  classId: z.string().optional(),
  sectionId: z.string().optional(),
  status: z.enum(STUDENT_STATUSES).optional(),
});
export type ListStudentsQuery = z.infer<typeof listStudentsQuerySchema>;
