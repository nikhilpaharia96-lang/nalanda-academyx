"use client";

import { Printer } from "lucide-react";

export interface MarksheetSubjectRow {
  subjectId: string;
  subjectName: string;
  maxMarks: number;
  passMarks: number;
  obtainedMarks: number;
  grade: string | null;
  passed: boolean;
}

export interface MarksheetData {
  school: string;
  academicSession: string;
  examId: string;
  examName: string;
  examStatus: "DRAFT" | "PUBLISHED";
  student: {
    studentId: string;
    name: string;
    rollNumber: string;
    class: string;
    section: string;
  };
  subjects: MarksheetSubjectRow[];
  totals: {
    obtainedMarks: number;
    maxMarks: number;
    percentage: number;
    grade: string;
    result: "PASS" | "FAIL";
  };
  publishedAt: string | null;
}

/** The professional marksheet layout requested in the spec — used identically
 * on the admin "view student marksheet" page and the student's own results
 * page, so there is exactly one place that defines what a marksheet looks
 * like. `window.print()` + the print stylesheet below is this project's
 * "download as PDF" path (no PDF library exists in the codebase yet — the
 * browser's own Print → Save as PDF covers the requirement without adding a
 * new dependency for a single feature). */
export function MarksheetView({ data, showDraftBanner = false }: { data: MarksheetData; showDraftBanner?: boolean }) {
  return (
    <div className="mx-auto max-w-3xl">
      {showDraftBanner && data.examStatus === "DRAFT" && (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800 print:hidden">
          This exam is still in <strong>Draft</strong> — students cannot see this marksheet yet.
        </div>
      )}

      <div className="mb-4 flex justify-end gap-2 print:hidden">
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-md bg-academic px-4 py-2 text-sm font-medium text-white transition hover:bg-academic-light"
        >
          <Printer className="h-4 w-4" />
          Print / Save as PDF
        </button>
      </div>

      <div id="marksheet-print-area" className="rounded-lg border border-neutral-200 bg-white p-8 shadow-sm print:border-none print:shadow-none">
        <div className="mb-6 border-b-2 border-navy pb-4 text-center">
          <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-navy">{data.school}</h1>
          <p className="mt-1 text-sm font-semibold uppercase tracking-widest text-academic">Student Marksheet</p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
          <div>
            <span className="text-neutral-500">Academic Session: </span>
            <span className="font-medium text-navy">{data.academicSession}</span>
          </div>
          <div>
            <span className="text-neutral-500">Examination: </span>
            <span className="font-medium text-navy">{data.examName}</span>
          </div>
          <div>
            <span className="text-neutral-500">Student Name: </span>
            <span className="font-medium text-navy">{data.student.name}</span>
          </div>
          <div>
            <span className="text-neutral-500">Student ID: </span>
            <span className="font-mono text-xs font-medium text-navy">{data.student.studentId}</span>
          </div>
          <div>
            <span className="text-neutral-500">Class: </span>
            <span className="font-medium text-navy">{data.student.class}</span>
          </div>
          <div>
            <span className="text-neutral-500">Section: </span>
            <span className="font-medium text-navy">{data.student.section || "—"}</span>
          </div>
          <div>
            <span className="text-neutral-500">Roll No.: </span>
            <span className="font-medium text-navy">{data.student.rollNumber}</span>
          </div>
        </div>

        <table className="mb-6 w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b-2 border-navy text-xs uppercase tracking-wide text-neutral-600">
              <th className="py-2 pr-2 font-semibold">Subject</th>
              <th className="py-2 px-2 text-right font-semibold">Max Marks</th>
              <th className="py-2 px-2 text-right font-semibold">Pass Marks</th>
              <th className="py-2 px-2 text-right font-semibold">Obtained</th>
              <th className="py-2 pl-2 text-right font-semibold">Grade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {data.subjects.map((s) => (
              <tr key={s.subjectId} className={!s.passed ? "text-red-700" : ""}>
                <td className="py-2 pr-2">{s.subjectName}</td>
                <td className="py-2 px-2 text-right font-mono">{s.maxMarks}</td>
                <td className="py-2 px-2 text-right font-mono">{s.passMarks}</td>
                <td className="py-2 px-2 text-right font-mono font-medium">{s.obtainedMarks}</td>
                <td className="py-2 pl-2 text-right font-semibold">{s.grade}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mb-6 grid grid-cols-2 gap-x-8 gap-y-1 border-t-2 border-navy pt-4 text-sm">
          <div>
            <span className="text-neutral-500">Total Marks: </span>
            <span className="font-semibold text-navy">
              {data.totals.obtainedMarks} / {data.totals.maxMarks}
            </span>
          </div>
          <div>
            <span className="text-neutral-500">Percentage: </span>
            <span className="font-semibold text-navy">{data.totals.percentage}%</span>
          </div>
          <div>
            <span className="text-neutral-500">Overall Grade: </span>
            <span className="font-semibold text-navy">{data.totals.grade}</span>
          </div>
          <div>
            <span className="text-neutral-500">Result: </span>
            <span className={`font-bold ${data.totals.result === "PASS" ? "text-emerald-700" : "text-red-700"}`}>{data.totals.result}</span>
          </div>
        </div>

        <div className="mb-2 text-sm">
          <span className="text-neutral-500">Remarks: </span>
          <span className="text-navy">
            {data.totals.result === "PASS" ? "Good performance." : "Needs improvement — please meet the subject teacher."}
          </span>
        </div>

        {data.publishedAt && (
          <p className="mt-6 border-t border-neutral-200 pt-3 text-right text-xs text-neutral-400">
            Published on {new Date(data.publishedAt).toLocaleDateString()}
          </p>
        )}
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #marksheet-print-area,
          #marksheet-print-area * {
            visibility: visible;
          }
          #marksheet-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
