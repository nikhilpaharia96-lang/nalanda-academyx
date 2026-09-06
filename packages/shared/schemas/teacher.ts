import { z } from "zod";

export const createTeacherSchema = z.object({
  // Optional: if the teacher has no personal email, the server generates a
  // unique institutional login address instead — see TeachersService.
  email: z.string().email().optional(),
  password: z.string().min(8).optional(), // if omitted, a temp password is generated
  name: z.string().min(2),
  dateOfBirth: z.string().date().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  phone: z.string().min(7).max(20).optional(),
  address: z.string().optional(),
  employeeId: z.string().min(1).optional(), // if omitted, a unique one is generated
  qualification: z.string().optional(),
  department: z.string().optional(),
  subject: z.string().optional(),
  designation: z.string().optional(),
  joiningDate: z.string().date(),
});
export type CreateTeacherDto = z.infer<typeof createTeacherSchema>;

export const updateTeacherSchema = z.object({
  name: z.string().optional(),
  subject: z.string().optional(),
  department: z.string().optional(),
  qualification: z.string().optional(),
  designation: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});
export type UpdateTeacherDto = z.infer<typeof updateTeacherSchema>;
