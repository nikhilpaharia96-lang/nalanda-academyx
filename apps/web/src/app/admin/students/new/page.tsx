"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { api, ApiError } from "@/lib/api-client";
import {
  UserPlus,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Printer,
  ArrowLeft,
  Check,
} from "lucide-react";

interface OptionRow {
  id: string;
  name: string;
}

interface CreateStudentResult {
  student: { id: string; name: string; studentId: string; admissionNumber: string };
  loginEmail: string;
  temporaryPassword?: string;
}

const initialForm = {
  name: "",
  fatherName: "",
  motherName: "",
  dateOfBirth: "",
  gender: "",
  classId: "",
  sectionId: "",
  academicYearId: "",
  rollNumber: "",
  admissionDate: "",
  phone: "",
  email: "",
  address: "",
};

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-navy">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

const inputClass =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-navy placeholder:text-neutral-400 focus:border-academic focus:outline-none focus:ring-1 focus:ring-academic";

export default function AddStudentPage() {
  const [form, setForm] = useState(initialForm);
  const [classes, setClasses] = useState<OptionRow[]>([]);
  const [sections, setSections] = useState<OptionRow[]>([]);
  const [academicYears, setAcademicYears] = useState<OptionRow[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CreateStudentResult | null>(null);
  const [copied, setCopied] = useState(false);

  const loadOptions = () => {
    setLoadingOptions(true);
    setOptionsError(null);
    Promise.all([
      api.get<OptionRow[]>("/classes"),
      api.get<OptionRow[]>("/academic-years"),
    ])
      .then(([classRows, yearRows]) => {
        setClasses(classRows);
        setAcademicYears(yearRows);
      })
      .catch((e) => setOptionsError(e instanceof ApiError ? e.message : "Failed to load classes and academic years."))
      .finally(() => setLoadingOptions(false));
  };

  useEffect(() => {
    loadOptions();
  }, []);

  useEffect(() => {
    if (!form.classId) {
      setSections([]);
      return;
    }
    api
      .get<OptionRow[]>(`/sections?classId=${form.classId}`)
      .then(setSections)
      .catch(() => setSections([]));
  }, [form.classId]);

  function update<K extends keyof typeof initialForm>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    if (fieldErrors[key]) setFieldErrors((e) => ({ ...e, [key]: "" }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setFieldErrors({});

    const required: (keyof typeof initialForm)[] = [
      "name",
      "dateOfBirth",
      "gender",
      "classId",
      "sectionId",
      "academicYearId",
      "rollNumber",
      "admissionDate",
    ];
    const missing: Record<string, string> = {};
    for (const key of required) {
      if (!form[key]) missing[key] = "This field is required";
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      missing.email = "Enter a valid email address";
    }
    if (Object.keys(missing).length > 0) {
      setFieldErrors(missing);
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, string> = { ...form };
      // Optional fields: omit empty strings so the backend generates/skips them
      // rather than validating an empty string as a bad value.
      for (const key of ["fatherName", "motherName", "phone", "email", "address"] as const) {
        if (!payload[key]) delete payload[key];
      }
      const res = await api.post<CreateStudentResult>("/students", payload);
      setResult(res);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.issues && err.issues.length > 0) {
          const mapped: Record<string, string> = {};
          for (const issue of err.issues) {
            const key = String(issue.path[0]);
            mapped[key] = issue.message;
          }
          setFieldErrors(mapped);
          setSubmitError("Please fix the highlighted fields.");
        } else {
          setSubmitError(err.message);
        }
      } else {
        setSubmitError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  function copyCredentials() {
    if (!result) return;
    const text = `Student: ${result.student.name}\nStudent ID: ${result.student.studentId}\nAdmission No.: ${result.student.admissionNumber}\nLogin Email: ${result.loginEmail}\nTemporary Password: ${result.temporaryPassword || "(unchanged — set explicitly by admin)"}\nStudent Portal: ${window.location.origin}/student/login`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function printCredentials() {
    window.print();
  }

  // -------------------------------------------------------------------
  // Success screen
  // -------------------------------------------------------------------
  if (result) {
    return (
      <AdminShell>
        <div className="ledger-bg border-b border-neutral-200 bg-white px-6 py-6 md:px-8">
          <p className="font-mono text-xs uppercase tracking-widest text-academic">Admin Portal</p>
          <h1 className="font-display text-2xl font-bold text-navy">Add Student</h1>
        </div>

        <div className="mx-auto max-w-xl p-6 md:p-8">
          <div id="print-credentials" className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-navy">Student Created Successfully</h2>
                <p className="text-xs text-neutral-500">Save these credentials now — the password won&apos;t be shown again.</p>
              </div>
            </div>

            <dl className="space-y-2.5 rounded-md bg-neutral-50 p-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-500">Name</dt>
                <dd className="font-medium text-navy">{result.student.name}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-500">Student ID</dt>
                <dd className="font-mono font-medium text-navy">{result.student.studentId}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-500">Admission No.</dt>
                <dd className="font-mono font-medium text-navy">{result.student.admissionNumber}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-500">Login Email</dt>
                <dd className="break-all text-right font-mono font-medium text-navy">{result.loginEmail}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-500">Temporary Password</dt>
                <dd className="font-mono font-bold text-academic">{result.temporaryPassword}</dd>
              </div>
            </dl>

            <p className="mt-3 text-xs text-gold-dark">
              The student must change this temporary password after their first login.
            </p>

            <div className="mt-5 flex flex-wrap gap-2 print:hidden">
              <button
                onClick={copyCredentials}
                className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-navy transition hover:bg-neutral-50"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy Credentials"}
              </button>
              <button
                onClick={printCredentials}
                className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-navy transition hover:bg-neutral-50"
              >
                <Printer className="h-4 w-4" />
                Print / Download
              </button>
              <a
                href="/student/login"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md bg-academic px-3 py-2 text-sm font-medium text-white transition hover:bg-academic-light"
              >
                Open Student Portal
              </a>
            </div>
          </div>

          <div className="mt-4 flex gap-3 print:hidden">
            <Link href="/admin/students" className="text-sm font-medium text-academic hover:underline">
              View in All Students
            </Link>
            <button
              onClick={() => {
                setResult(null);
                setForm(initialForm);
              }}
              className="text-sm font-medium text-neutral-500 hover:underline"
            >
              Add another student
            </button>
          </div>
        </div>
      </AdminShell>
    );
  }

  // -------------------------------------------------------------------
  // Form
  // -------------------------------------------------------------------
  return (
    <AdminShell>
      <div className="ledger-bg border-b border-neutral-200 bg-white px-6 py-6 md:px-8">
        <p className="font-mono text-xs uppercase tracking-widest text-academic">Admin Portal</p>
        <div className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-academic" />
          <h1 className="font-display text-2xl font-bold text-navy">Add Student</h1>
        </div>
        <p className="mt-1 text-sm text-neutral-500">
          Creates the student&apos;s record and a login account with a secure temporary password.
        </p>
      </div>

      <div className="mx-auto max-w-3xl p-6 md:p-8">
        {loadingOptions && (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-neutral-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading classes and academic years…
          </div>
        )}

        {!loadingOptions && optionsError && (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-red-200 bg-red-50 py-10 text-center">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <p className="text-sm text-red-600">{optionsError}</p>
            <button onClick={loadOptions} className="text-xs font-medium text-red-700 underline">
              Retry
            </button>
          </div>
        )}

        {!loadingOptions && !optionsError && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {submitError && (
              <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {submitError}
              </div>
            )}

            <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 font-display text-sm font-semibold text-navy">Student Details</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Student Name" required error={fieldErrors.name}>
                  <input className={inputClass} value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Rahul Sharma" />
                </Field>
                <Field label="Date of Birth" required error={fieldErrors.dateOfBirth}>
                  <input type="date" className={inputClass} value={form.dateOfBirth} onChange={(e) => update("dateOfBirth", e.target.value)} />
                </Field>
                <Field label="Gender" required error={fieldErrors.gender}>
                  <select className={inputClass} value={form.gender} onChange={(e) => update("gender", e.target.value)}>
                    <option value="">Select gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </Field>
                <Field label="Father's Name" error={fieldErrors.fatherName}>
                  <input className={inputClass} value={form.fatherName} onChange={(e) => update("fatherName", e.target.value)} placeholder="Suresh Sharma" />
                </Field>
                <Field label="Mother's Name" error={fieldErrors.motherName}>
                  <input className={inputClass} value={form.motherName} onChange={(e) => update("motherName", e.target.value)} placeholder="Anita Sharma" />
                </Field>
                <Field label="Mobile Number" error={fieldErrors.phone}>
                  <input className={inputClass} value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="98765 43210" />
                </Field>
              </div>
            </section>

            <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 font-display text-sm font-semibold text-navy">Academic Details</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Class" required error={fieldErrors.classId}>
                  <select className={inputClass} value={form.classId} onChange={(e) => update("classId", e.target.value)}>
                    <option value="">Select class</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Section" required error={fieldErrors.sectionId}>
                  <select className={inputClass} value={form.sectionId} onChange={(e) => update("sectionId", e.target.value)} disabled={!form.classId}>
                    <option value="">{form.classId ? "Select section" : "Select a class first"}</option>
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Academic Session" required error={fieldErrors.academicYearId}>
                  <select className={inputClass} value={form.academicYearId} onChange={(e) => update("academicYearId", e.target.value)}>
                    <option value="">Select session</option>
                    {academicYears.map((y) => (
                      <option key={y.id} value={y.id}>
                        {y.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Roll Number" required error={fieldErrors.rollNumber}>
                  <input className={inputClass} value={form.rollNumber} onChange={(e) => update("rollNumber", e.target.value)} placeholder="RS-101" />
                </Field>
                <Field label="Admission Date" required error={fieldErrors.admissionDate}>
                  <input type="date" className={inputClass} value={form.admissionDate} onChange={(e) => update("admissionDate", e.target.value)} />
                </Field>
              </div>
              <p className="mt-3 text-xs text-neutral-400">
                Admission Number and Student ID are generated automatically after submission.
              </p>
            </section>

            <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 font-display text-sm font-semibold text-navy">Contact & Login</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Email (optional)" error={fieldErrors.email}>
                  <input className={inputClass} value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="Leave blank to auto-generate a login email" />
                </Field>
                <Field label="Address" error={fieldErrors.address}>
                  <input className={inputClass} value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="Street, City" />
                </Field>
              </div>
              <p className="mt-3 text-xs text-neutral-400">
                If no email is provided, a unique institutional login email is generated automatically for the student.
              </p>
            </section>

            <div className="flex items-center justify-end gap-3">
              <Link href="/admin/students" className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-navy">
                <ArrowLeft className="h-4 w-4" />
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-md bg-academic px-5 py-2.5 text-sm font-medium text-white transition hover:bg-academic-light disabled:opacity-60"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? "Creating…" : "Create Student"}
              </button>
            </div>
          </form>
        )}
      </div>
    </AdminShell>
  );
}
