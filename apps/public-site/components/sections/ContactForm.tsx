"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, AlertCircle, User, Mail, Phone, Tag, PenLine, Send, type LucideIcon } from "lucide-react";
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

export function ContactForm({ variant = "light" }: { variant?: "light" | "dark" }) {
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

  if (variant === "dark") {
    const inputCls =
      "focus-ring w-full rounded-md border border-transparent bg-white py-3 pl-10 pr-3 text-sm text-navy-950 placeholder:text-slate-500 lg:py-[0.75vw] lg:text-[min(0.85vw,0.85rem)]";
    const Field = ({ id, k, Icon, label, type = "text" }: { id: string; k: keyof FormState; Icon: LucideIcon; label: string; type?: string }) => (
      <div>
        <div className="relative">
          <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" strokeWidth={1.6} />
          <input id={id} type={type} aria-label={label} placeholder={label} className={inputCls} value={form[k]} onChange={(e) => update(k, e.target.value)} aria-invalid={!!errors[k]} />
        </div>
        {errors[k] && <p className="mt-1 text-xs text-red-300">{errors[k]}</p>}
      </div>
    );
    if (status === "success") {
      return (
        <div className="py-8 text-center text-white">
          <CheckCircle2 className="mx-auto h-10 w-10 text-gold-400" />
          <h3 className="mt-3 font-display text-xl font-semibold">Message sent</h3>
          <p className="mt-2 text-sm text-white/80">{feedback}</p>
          <button type="button" onClick={() => setStatus("idle")} className="mt-5 rounded-md bg-gold-500 px-5 py-2.5 text-sm font-semibold text-navy-950 hover:bg-gold-400">
            Send another message
          </button>
        </div>
      );
    }
    return (
      <form onSubmit={handleSubmit} noValidate className="space-y-3 lg:space-y-[0.7vw]">
        <div className="grid gap-3 sm:grid-cols-2 lg:gap-[0.7vw]">
          <Field id="c-name" k="name" Icon={User} label="Your Name" />
          <Field id="c-email" k="email" Icon={Mail} label="Email Address" type="email" />
          <Field id="c-phone" k="phone" Icon={Phone} label="Phone Number" type="tel" />
          <Field id="c-subject" k="subject" Icon={Tag} label="Subject" />
        </div>
        <div>
          <div className="relative">
            <PenLine className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-500 lg:top-[0.9vw]" strokeWidth={1.6} />
            <textarea id="c-message" aria-label="Your Message" placeholder="Your Message" rows={3} className={`${inputCls} resize-none lg:h-[5.2vw]`} value={form.message} onChange={(e) => update("message", e.target.value)} aria-invalid={!!errors.message} />
          </div>
          {errors.message && <p className="mt-1 text-xs text-red-300">{errors.message}</p>}
        </div>
        {status === "error" && (
          <p className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" /> {feedback}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-4 pt-1 lg:gap-[1.4vw]">
          <button
            type="submit"
            disabled={status === "loading"}
            className="focus-ring inline-flex items-center gap-2 rounded-md bg-gold-500 px-6 py-3 text-sm font-bold uppercase text-navy-950 transition-colors hover:bg-gold-400 disabled:opacity-60 lg:px-[1.6vw] lg:py-[0.75vw] lg:text-[min(0.85vw,0.85rem)]"
          >
            {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Send Message
            {status !== "loading" && <Send className="h-4 w-4" />}
          </button>
          <p className="flex items-center gap-2 text-sm text-white/85 lg:text-[min(0.8vw,0.8rem)]">
            <CheckCircle2 className="h-4 w-4 text-gold-400" strokeWidth={1.6} /> We will get back to you soon!
          </p>
        </div>
      </form>
    );
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
