"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { submitContactMessage, type ContactMessagePayload } from "@/lib/services/contactService";

type FormState = ContactMessagePayload;
type Errors = Partial<Record<keyof FormState, string>>;

const initialState: FormState = { name: "", phone: "", email: "", subject: "", message: "" };
const phonePattern = /^[+]?[\d\s-]{7,15}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(form: FormState): Errors {
  const errors: Errors = {};
  if (!form.name.trim()) errors.name = "Name is required.";
  if (!phonePattern.test(form.phone)) errors.phone = "Enter a valid phone number.";
  if (!emailPattern.test(form.email)) errors.email = "Enter a valid email address.";
  if (!form.subject.trim()) errors.subject = "Subject is required.";
  if (!form.message.trim()) errors.message = "Message is required.";
  return errors;
}

export function ContactForm() {
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
      const res = await submitContactMessage(form);
      setFeedback(res.message);
      setStatus(res.success ? "success" : "error");
      if (res.success) setForm(initialState);
    } catch {
      setStatus("error");
      setFeedback("Something went wrong while sending your message. Please try again.");
    }
  }

  const fieldClass =
    "focus-ring w-full rounded-[var(--radius-md)] border border-line bg-white px-4 py-3 text-sm text-navy-950 placeholder:text-slate-400";

  if (status === "success") {
    return (
      <div className="rounded-[var(--radius-lg)] border border-line bg-paper p-10 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-gold-500" />
        <h3 className="mt-4 font-display text-xl font-semibold text-navy-950">Message sent</h3>
        <p className="mt-2 text-sm text-slate-600">{feedback}</p>
        <Button variant="secondary" className="mt-6" onClick={() => setStatus("idle")}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="c-name" className="mb-1.5 block text-sm text-slate-600">
            Name
          </label>
          <input id="c-name" className={fieldClass} value={form.name} onChange={(e) => update("name", e.target.value)} aria-invalid={!!errors.name} />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
        </div>
        <div>
          <label htmlFor="c-phone" className="mb-1.5 block text-sm text-slate-600">
            Phone
          </label>
          <input id="c-phone" type="tel" className={fieldClass} value={form.phone} onChange={(e) => update("phone", e.target.value)} aria-invalid={!!errors.phone} />
          {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="c-email" className="mb-1.5 block text-sm text-slate-600">
            Email
          </label>
          <input id="c-email" type="email" className={fieldClass} value={form.email} onChange={(e) => update("email", e.target.value)} aria-invalid={!!errors.email} />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="c-subject" className="mb-1.5 block text-sm text-slate-600">
            Subject
          </label>
          <input id="c-subject" className={fieldClass} value={form.subject} onChange={(e) => update("subject", e.target.value)} aria-invalid={!!errors.subject} />
          {errors.subject && <p className="mt-1 text-xs text-red-600">{errors.subject}</p>}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="c-message" className="mb-1.5 block text-sm text-slate-600">
            Message
          </label>
          <textarea id="c-message" rows={4} className={fieldClass} value={form.message} onChange={(e) => update("message", e.target.value)} aria-invalid={!!errors.message} />
          {errors.message && <p className="mt-1 text-xs text-red-600">{errors.message}</p>}
        </div>
      </div>

      {status === "error" && (
        <p className="flex items-center gap-2 rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {feedback}
        </p>
      )}

      <Button type="submit" variant="primary" disabled={status === "loading"} className="w-full sm:w-auto">
        {status === "loading" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Sending…
          </>
        ) : (
          "Send Message"
        )}
      </Button>
    </form>
  );
}
