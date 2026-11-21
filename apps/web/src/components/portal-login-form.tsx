"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth, ApiError } from "@/lib/auth-context";
import { ArrowLeft, Eye, EyeOff, GraduationCap, Loader2, Lock, Mail, Users, BookOpen } from "lucide-react";

const PORTAL_LINKS = [
  { href: "/student/login", label: "Student", icon: GraduationCap },
  { href: "/teacher/login", label: "Teacher", icon: BookOpen },
  { href: "/parent/login", label: "Parent", icon: Users },
];

export function PortalLoginForm({
  title,
  subtitle,
  demoEmail,
  showPortalSwitcher = true,
}: {
  title: string;
  subtitle: string;
  demoEmail: string;
  /** Hide the Student/Teacher/Parent switcher (e.g. on the admin sign-in). */
  showPortalSwitcher?: boolean;
}) {
  const { login } = useAuth();
  const [email, setEmail] = useState(demoEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Kuch galat ho gaya. Please dobara try karein.");
    } finally {
      setSubmitting(false);
    }
  }

  const input =
    "w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-portal focus:bg-white focus:ring-2 focus:ring-portal/20";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-portal-dark via-portal-dark to-portal px-4 py-8">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-4 inline-flex items-center gap-1.5 text-sm text-blue-100 transition hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to website
        </Link>

        <div className="overflow-hidden rounded-3xl bg-white shadow-2xl">
          {/* Header */}
          <div className="bg-portal px-6 pb-6 pt-7 text-center text-white">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-md">
              <Image src="/images/brand/nalanda-academy-logo.webp" alt="Nalanda Academy" width={44} height={44} className="h-11 w-11 object-contain" priority />
            </div>
            <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-blue-100">Nalanda Academy Cloud</p>
            <h1 className="mt-1 font-display text-2xl font-extrabold">{title}</h1>
            <p className="mt-1 text-sm text-blue-100">{subtitle}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 p-6">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  inputMode="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={input}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="Apna password daalein"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${input} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-portal py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-blue-600 disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Signing in…" : "Sign in"}
            </button>

            <p className="text-center text-sm text-slate-500">Password bhool gaye? School admin se sampark karein.</p>
          </form>

          {showPortalSwitcher && (
            <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
              <p className="mb-2 text-center text-xs font-medium uppercase tracking-wide text-slate-500">Sign in as</p>
              <div className="grid grid-cols-3 gap-2">
                {PORTAL_LINKS.map(({ href, label, icon: Icon }) => {
                  const current = title.toLowerCase().startsWith(label.toLowerCase());
                  return (
                    <Link
                      key={href}
                      href={href}
                      aria-current={current ? "page" : undefined}
                      className={`flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-medium transition ${
                        current ? "bg-portal-soft text-portal-dark ring-1 ring-portal/40" : "text-slate-600 hover:bg-white"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {label}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <p className="mt-5 text-center text-xs text-blue-100">Powered by: Nikhil Paharia</p>
      </div>
    </main>
  );
}
