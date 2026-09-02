import { z } from "zod";
import { EXAM_STATUSES } from "../enums";

// --- Exam Types --------------------------------------------------------

export const createExamTypeSchema = z.object({
  name: z.string().min(2).max(100),
});
export type CreateExamTypeDto = z.infer<typeof createExamTypeSchema>;

export const updateExamTypeSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  active: z.boolean().optional(),
});
export type UpdateExamTypeDto = z.infer<typeof updateExamTypeSchema>;

// --- Subjects ------------------------------------------------------------

export const createSubjectSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().max(20).optional(),
});
export type CreateSubjectDto = z.infer<typeof createSubjectSchema>;

export const updateSubjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  code: z.string().max(20).optional(),
  active: z.boolean().optional(),
});
export type UpdateSubjectDto = z.infer<typeof updateSubjectSchema>;

export const assignClassSubjectSchema = z.object({
  classId: z.string().min(1),
  subjectId: z.string().min(1),
});
export type AssignClassSubjectDto = z.infer<typeof assignClassSubjectSchema>;

// --- Exams -----------------------------------------------------------------

export const createExamSchema = z
  .object({
    name: z.string().min(2).max(150),
    examTypeId: z.string().min(1),
    academicYearId: z.string().min(1),
    classId: z.string().min(1),
    sectionId: z.string().min(1).optional(),
    startDate: z.string().date(),
    endDate: z.string().date(),
    description: z.string().max(2000).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.endDate < data.startDate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["endDate"], message: "End date must be on or after the start date" });
    }
  });
export type CreateExamDto = z.infer<typeof createExamSchema>;

export const updateExamSchema = z.object({
  name: z.string().min(2).max(150).optional(),
  examTypeId: z.string().min(1).optional(),
  sectionId: z.string().min(1).nullable().optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  description: z.string().max(2000).optional(),
});
export type UpdateExamDto = z.infer<typeof updateExamSchema>;

export const listExamsQuerySchema = z.object({
  academicYearId: z.string().optional(),
  classId: z.string().optional(),
  sectionId: z.string().optional(),
  examTypeId: z.string().optional(),
  status: z.enum(EXAM_STATUSES).optional(),
});
export type ListExamsQuery = z.infer<typeof listExamsQuerySchema>;

// --- Results -----------------------------------------------------------------

const resultRowSchema = z
  .object({
    studentId: z.string().min(1),
    maxMarks: z.number().positive().max(1000),
    passMarks: z.number().min(0).max(1000),
    obtainedMarks: z.number().min(0).max(1000),
    remarks: z.string().max(500).optional(),
  })
  .superRefine((row, ctx) => {
    if (row.passMarks > row.maxMarks) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["passMarks"], message: "Pass marks cannot exceed max marks" });
    }
    if (row.obtainedMarks > row.maxMarks) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["obtainedMarks"], message: "Obtained marks cannot exceed max marks" });
    }
  });

export const bulkSaveResultsSchema = z.object({
  examId: z.string().min(1),
  subjectId: z.string().min(1),
  results: z.array(resultRowSchema).min(1).max(500),
});
export type BulkSaveResultsDto = z.infer<typeof bulkSaveResultsSchema>;

export const updateResultSchema = z
  .object({
    maxMarks: z.number().positive().max(1000).optional(),
    passMarks: z.number().min(0).max(1000).optional(),
    obtainedMarks: z.number().min(0).max(1000).optional(),
    remarks: z.string().max(500).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: "At least one field must be provided" });
export type UpdateResultDto = z.infer<typeof updateResultSchema>;
