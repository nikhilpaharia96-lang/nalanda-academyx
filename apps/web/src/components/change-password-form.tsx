"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import { Loader2 } from "lucide-react";

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match." });
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/auth/change-password", { currentPassword, newPassword });
      setMessage({ type: "success", text: "Password updated successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setMessage({ type: "error", text: err instanceof ApiError ? err.message : "Failed to update password" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-sm space-y-4 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="font-display font-semibold text-navy">Change Password</h2>
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-500">Current password</label>
        <input type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-academic" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-500">New password</label>
        <input type="password" required minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-academic" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-500">Confirm new password</label>
        <input type="password" required minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-academic" />
      </div>
      {message && <p className={`rounded-md px-3 py-2 text-sm ${message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{message.text}</p>}
      <button type="submit" disabled={submitting} className="flex items-center gap-2 rounded-md bg-academic px-4 py-2 text-sm font-semibold text-white transition hover:bg-academic-light disabled:opacity-60">
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Update Password
      </button>
    </form>
  );
}
