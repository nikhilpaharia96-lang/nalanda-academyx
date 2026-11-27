import { z } from "zod";

// AttendX request shapes. Note what is NOT here: no student id on a scan (it comes from the signed-in
// account), no outcome/flags/status (computed on the server), no timestamps (server clock only).

export const issueBindingCodeSchema = z.object({ studentId: z.string().min(1) });

export const bindDeviceSchema = z.object({
  code: z.string().trim().min(6).max(16),
  publicKey: z.string().min(60).max(400), // base64 SPKI, ECDSA P-256
});

export const startAttendxSessionSchema = z.object({
  classId: z.string().min(1),
  sectionId: z.string().min(1),
  academicYearId: z.string().min(1),
  subjectId: z.string().min(1).optional(),
  qrIntervalSec: z.number().int().min(5).max(30).default(10),
  minScore: z.number().min(0.5).max(1).default(0.75),
  initialWindowSec: z.number().int().min(60).max(900).default(300),
});
export type StartAttendxSessionDto = z.infer<typeof startAttendxSessionSchema>;

export const launchCheckSchema = z.object({
  kind: z.enum(["CODE", "PING"]),
  durationSec: z.number().int().min(15).max(120).default(30),
});
export type LaunchCheckDto = z.infer<typeof launchCheckSchema>;

export const submitCheckSchema = z.object({
  nonce: z.string().min(10).max(64),
  qrToken: z.string().max(64).optional(),
  answer: z.string().max(12).optional(),
  signature: z.string().min(40).max(200), // base64 raw r||s from WebCrypto
});
export type SubmitCheckDto = z.infer<typeof submitCheckSchema>;

export const attendxDecisionSchema = z.object({
  status: z.enum(["PRESENT", "ABSENT", "LATE", "LEAVE"]),
  reason: z.string().trim().min(3).max(300),
});
export type AttendxDecisionDto = z.infer<typeof attendxDecisionSchema>;
