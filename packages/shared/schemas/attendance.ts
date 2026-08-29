import { z } from "zod";
import { ATTENDANCE_STATUSES } from "../enums";

export const markAttendanceSchema = z.object({
  classId: z.string().min(1),
  sectionId: z.string().min(1),
  academicYearId: z.string().min(1),
  date: z.string().date(),
  records: z
    .array(
      z.object({
        studentId: z.string().min(1),
        status: z.enum(ATTENDANCE_STATUSES),
        remarks: z.string().optional(),
      }),
    )
    .min(1),
});
export type MarkAttendanceDto = z.infer<typeof markAttendanceSchema>;
