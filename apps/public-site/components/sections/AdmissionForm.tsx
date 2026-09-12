"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { submitAdmissionEnquiry, type AdmissionClassOption, type AdmissionEnquiryPayload } from "@/lib/services/admissionService";

type FormState = AdmissionEnquiryPayload;
type Errors = Partial<Record<keyof FormState, string>>;

const initialState: FormState = {
  studentName: "",
  dateOfBirth: "",
  gender: "",
  classId: "",
  previousSchool: "",
  parentName: "",
  parentPhone: "",
  parentEmail: "",
  address: "",
  message: "",
};

const phonePattern = /^[+]?[\d\s-]{7,15}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(form: FormState): Errors {
  const errors: Errors = {};
  if (!form.studentName.trim()) errors.studentName = "Student name is required.";
  if (!form.dateOfBirth) errors.dateOfBirth = "Date of birth is required.";
  else if (new Date(form.dateOfBirth) > new Date()) errors.dateOfBirth = "Date of birth cannot be in the future.";
  if (!form.gender) errors.gender = "Please select a gender.";
  if (!form.classId) errors.classId = "Please select a class.";
  if (!form.parentName.trim()) errors.parentName = "Parent/guardian name is required.";
  if (!phonePattern.test(form.parentPhone)) errors.parentPhone = "Enter a valid phone number.";
  if (!emailPattern.test(form.parentEmail)) errors.parentEmail = "Enter a valid email address.";
  if (!form.address.trim()) errors.address = "Address is required.";
  return errors;
}

export function AdmissionForm({ classes }: { classes: AdmissionClassOption[] }) {
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState("");

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const validation = validate(form);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setStatus("loading");
    try {
      const res = await submitAdmissionEnquiry(form);
      setFeedback(res.message);
      setStatus(res.success ? "success" : "error");
      if (res.success) setForm(initialState);
    } catch {
      setStatus("error");
      setFeedback("Something went wrong while submitting the form. Please try again.");
    }
  }

  const fieldClass =
    "focus-ring w-full rounded-[var(--radius-md)] border border-line bg-white px-4 py-3 text-sm text-navy-950 placeholder:text-slate-400";

  if (status === "success") {
    return (
      <div className="rounded-[var(--radius-lg)] border border-line bg-paper p-10 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-gold-500" />
        <h3 className="mt-4 font-display text-xl font-semibold text-navy-950">Enquiry submitted</h3>
        <p className="mt-2 text-sm text-slate-600">{feedback}</p>
        <Button variant="secondary" className="mt-6" onClick={() => setStatus("idle")}>
          Submit another enquiry
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <fieldset className="space-y-4">
        <legend className="font-display text-base font-semibold text-navy-950">Student Details</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="studentName" className="mb-1.5 block text-sm text-slate-600">
              Student Name
            </label>
            <input
              id="studentName"
              className={fieldClass}
              value={form.studentName}
              onChange={(e) => update("studentName", e.target.value)}
              aria-invalid={!!errors.studentName}
            />
            {errors.studentName && <p className="mt-1 text-xs text-red-600">{errors.studentName}</p>}
          </div>
          <div>
            <label htmlFor="dob" className="mb-1.5 block text-sm text-slate-600">
              Date of Birth
            </label>
            <input
              id="dob"
              type="date"
              className={fieldClass}
              value={form.dateOfBirth}
              onChange={(e) => update("dateOfBirth", e.target.value)}
              aria-invalid={!!errors.dateOfBirth}
            />
            {errors.dateOfBirth && <p className="mt-1 text-xs text-red-600">{errors.dateOfBirth}</p>}
          </div>
          <div>
            <label htmlFor="gender" className="mb-1.5 block text-sm text-slate-600">
              Gender
            </label>
            <select
              id="gender"
              className={fieldClass}
              value={form.gender}
              onChange={(e) => update("gender", e.target.value)}
              aria-invalid={!!errors.gender}
            >
              <option value="">Select</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
            {errors.gender && <p className="mt-1 text-xs text-red-600">{errors.gender}</p>}
          </div>
          <div>
            <label htmlFor="classFor" className="mb-1.5 block text-sm text-slate-600">
              Class Applying For
            </label>
            <select
              id="classFor"
              className={fieldClass}
              value={form.classId}
              onChange={(e) => update("classId", e.target.value)}
              aria-invalid={!!errors.classId}
            >
              <option value="">Select</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.classId && <p className="mt-1 text-xs text-red-600">{errors.classId}</p>}
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="prevSchool" className="mb-1.5 block text-sm text-slate-600">
              Previous School (optional)
            </label>
            <input
              id="prevSchool"
              className={fieldClass}
              value={form.previousSchool}
              onChange={(e) => update("previousSchool", e.target.value)}
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="font-display text-base font-semibold text-navy-950">Parent / Guardian Details</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="parentName" className="mb-1.5 block text-sm text-slate-600">
              Parent/Guardian Name
            </label>
            <input
              id="parentName"
              className={fieldClass}
              value={form.parentName}
              onChange={(e) => update("parentName", e.target.value)}
              aria-invalid={!!errors.parentName}
            />
            {errors.parentName && <p className="mt-1 text-xs text-red-600">{errors.parentName}</p>}
          </div>
          <div>
            <label htmlFor="parentPhone" className="mb-1.5 block text-sm text-slate-600">
              Phone
            </label>
            <input
              id="parentPhone"
              type="tel"
              className={fieldClass}
              value={form.parentPhone}
              onChange={(e) => update("parentPhone", e.target.value)}
              aria-invalid={!!errors.parentPhone}
            />
            {errors.parentPhone && <p className="mt-1 text-xs text-red-600">{errors.parentPhone}</p>}
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="parentEmail" className="mb-1.5 block text-sm text-slate-600">
              Email
            </label>
            <input
              id="parentEmail"
              type="email"
              className={fieldClass}
              value={form.parentEmail}
              onChange={(e) => update("parentEmail", e.target.value)}
              aria-invalid={!!errors.parentEmail}
            />
            {errors.parentEmail && <p className="mt-1 text-xs text-red-600">{errors.parentEmail}</p>}
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="address" className="mb-1.5 block text-sm text-slate-600">
              Address
            </label>
            <textarea
              id="address"
              rows={3}
              className={fieldClass}
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              aria-invalid={!!errors.address}
            />
            {errors.address && <p className="mt-1 text-xs text-red-600">{errors.address}</p>}
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="message" className="mb-1.5 block text-sm text-slate-600">
              Message (optional)
            </label>
            <textarea
              id="message"
              rows={3}
              className={fieldClass}
              value={form.message}
              onChange={(e) => update("message", e.target.value)}
            />
          </div>
        </div>
      </fieldset>

      {status === "error" && (
        <p className="flex items-center gap-2 rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {feedback}
        </p>
      )}

      <Button type="submit" variant="primary" disabled={status === "loading"} className="w-full sm:w-auto">
        {status === "loading" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
          </>
        ) : (
          "Submit Enquiry"
        )}
      </Button>
    </form>
  );
}
