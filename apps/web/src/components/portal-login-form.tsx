"use client";

import { useState } from "react";
import { useAuth, ApiError } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function PortalLoginForm({
  title,
  subtitle,
  demoEmail,
  icon: Icon,
}: {
  title: string;
  subtitle: string;
  demoEmail: string;
  icon: LucideIcon;
}) {
  const { login } = useAuth();
  const [email, setEmail] = useState(demoEmail);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="ledger-bg flex min-h-screen items-center justify-center bg-navy px-4">
      <div className="w-full max-w-sm rounded-lg border border-white/10 bg-navy-light p-8 shadow-2xl">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gold/15">
            <Icon className="h-6 w-6 text-gold" />
          </div>
          <h1 className="font-display text-xl font-bold text-white">Nalanda Academy Cloud</h1>
          <p className="text-sm text-neutral-300">{subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-white/15 bg-navy px-3 py-2.5 text-white outline-none focus:border-gold"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-white/15 bg-navy px-3 py-2.5 text-white outline-none focus:border-gold"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-gold py-2.5 font-semibold text-navy transition hover:bg-gold-light disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Sign in
          </button>
        </form>

        <p className="mt-6 border-t border-white/10 pt-4 text-center text-xs text-neutral-400">
          Demo credentials: {demoEmail} — seeded via <code className="text-gold">npm run db:seed</code>
        </p>
      </div>
    </main>
  );
}
