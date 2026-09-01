"use client";

import { useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { api, ApiError } from "@/lib/api-client";
import { UserCog, Loader2, AlertTriangle, CheckCircle2, Copy, Printer, ArrowLeft, Check } from "lucide-react";

interface CreateTeacherResult {
  teacher: { id: string; name: string; employeeId: string };
  loginEmail: string;
  temporaryPassword?: string;
}

const initialForm = {
  name: "",
  dateOfBirth: "",
  gender: "",
  phone: "",
  email: "",
  address: "",
  qualification: "",
  department: "",
  subject: "",
  designation: "",
  joiningDate: "",
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

export default function AddTeacherPage() {
  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CreateTeacherResult | null>(null);
  const [copied, setCopied] = useState(false);

  function update<K extends keyof typeof initialForm>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    if (fieldErrors[key]) setFieldErrors((e) => ({ ...e, [key]: "" }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setFieldErrors({});

    const missing: Record<string, string> = {};
    if (!form.name) missing.name = "This field is required";
    if (!form.joiningDate) missing.joiningDate = "This field is required";
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
      for (const key of Object.keys(payload)) {
        if (!payload[key]) delete payload[key];
      }
      const res = await api.post<CreateTeacherResult>("/teachers", payload);
      setResult(res);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.issues && err.issues.length > 0) {
          const mapped: Record<string, string> = {};
          for (const issue of err.issues) mapped[String(issue.path[0])] = issue.message;
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
    const text = `Teacher: ${result.teacher.name}\nTeacher ID: ${result.teacher.employeeId}\nLogin Email: ${result.loginEmail}\nTemporary Password: ${result.temporaryPassword || "(unchanged — set explicitly by admin)"}\nTeacher Portal: ${window.location.origin}/teacher/login`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (result) {
    return (
      <AdminShell>
        <div className="ledger-bg border-b border-neutral-200 bg-white px-6 py-6 md:px-8">
          <p className="font-mono text-xs uppercase tracking-widest text-academic">Admin Portal</p>
          <h1 className="font-display text-2xl font-bold text-navy">Add Teacher</h1>
        </div>

        <div className="mx-auto max-w-xl p-6 md:p-8">
          <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-navy">Teacher Created Successfully</h2>
                <p className="text-xs text-neutral-500">Save these credentials now — the password won&apos;t be shown again.</p>
              </div>
            </div>

            <dl className="space-y-2.5 rounded-md bg-neutral-50 p-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-500">Name</dt>
                <dd className="font-medium text-navy">{result.teacher.name}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-500">Teacher ID</dt>
                <dd className="font-mono font-medium text-navy">{result.teacher.employeeId}</dd>
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
              The teacher must change this temporary password after their first login.
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
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-navy transition hover:bg-neutral-50"
              >
                <Printer className="h-4 w-4" />
                Print / Download
              </button>
              <a
                href="/teacher/login"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md bg-academic px-3 py-2 text-sm font-medium text-white transition hover:bg-academic-light"
              >
                Open Teacher Portal
              </a>
            </div>
          </div>

          <div className="mt-4 flex gap-3 print:hidden">
            <Link href="/admin/teachers" className="text-sm font-medium text-academic hover:underline">
              View in All Teachers
            </Link>
            <button
              onClick={() => {
                setResult(null);
                setForm(initialForm);
              }}
              className="text-sm font-medium text-neutral-500 hover:underline"
            >
              Add another teacher
            </button>
          </div>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="ledger-bg border-b border-neutral-200 bg-white px-6 py-6 md:px-8">
        <p className="font-mono text-xs uppercase tracking-widest text-academic">Admin Portal</p>
        <div className="flex items-center gap-2">
          <UserCog className="h-5 w-5 text-academic" />
          <h1 className="font-display text-2xl font-bold text-navy">Add Teacher</h1>
        </div>
        <p className="mt-1 text-sm text-neutral-500">
          Creates the teacher&apos;s record and a login account with a secure temporary password.
        </p>
      </div>

      <div className="mx-auto max-w-3xl p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {submitError && (
            <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {submitError}
            </div>
          )}

          <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-display text-sm font-semibold text-navy">Personal Details</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Teacher Name" required error={fieldErrors.name}>
                <input className={inputClass} value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Dr. Sangeeta Sarma" />
              </Field>
              <Field label="Date of Birth" error={fieldErrors.dateOfBirth}>
                <input type="date" className={inputClass} value={form.dateOfBirth} onChange={(e) => update("dateOfBirth", e.target.value)} />
              </Field>
              <Field label="Gender" error={fieldErrors.gender}>
                <select className={inputClass} value={form.gender} onChange={(e) => update("gender", e.target.value)}>
                  <option value="">Select gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </Field>
              <Field label="Phone Number" error={fieldErrors.phone}>
                <input className={inputClass} value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="98765 43210" />
              </Field>
              <Field label="Email (optional)" error={fieldErrors.email}>
                <input className={inputClass} value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="Leave blank to auto-generate a login email" />
              </Field>
              <Field label="Address" error={fieldErrors.address}>
                <input className={inputClass} value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="Street, City" />
              </Field>
            </div>
          </section>

          <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-display text-sm font-semibold text-navy">Professional Details</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Qualification" error={fieldErrors.qualification}>
                <input className={inputClass} value={form.qualification} onChange={(e) => update("qualification", e.target.value)} placeholder="M.Sc, B.Ed" />
              </Field>
              <Field label="Department" error={fieldErrors.department}>
                <input className={inputClass} value={form.department} onChange={(e) => update("department", e.target.value)} placeholder="Science" />
              </Field>
              <Field label="Subject(s)" error={fieldErrors.subject}>
                <input className={inputClass} value={form.subject} onChange={(e) => update("subject", e.target.value)} placeholder="Mathematics" />
              </Field>
              <Field label="Designation" error={fieldErrors.designation}>
                <input className={inputClass} value={form.designation} onChange={(e) => update("designation", e.target.value)} placeholder="Senior Teacher" />
              </Field>
              <Field label="Joining Date" required error={fieldErrors.joiningDate}>
                <input type="date" className={inputClass} value={form.joiningDate} onChange={(e) => update("joiningDate", e.target.value)} />
              </Field>
            </div>
            <p className="mt-3 text-xs text-neutral-400">Teacher ID is generated automatically after submission.</p>
          </section>

          <div className="flex items-center justify-end gap-3">
            <Link href="/admin/teachers" className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-navy">
              <ArrowLeft className="h-4 w-4" />
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-md bg-academic px-5 py-2.5 text-sm font-medium text-white transition hover:bg-academic-light disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Creating…" : "Create Teacher"}
            </button>
          </div>
        </form>
      </div>
    </AdminShell>
  );
}
