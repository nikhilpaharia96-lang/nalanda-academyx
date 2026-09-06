"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { api, ApiError } from "@/lib/api-client";
import { GraduationCap, UserCog, Loader2, AlertTriangle, RefreshCw, KeyRound, Ban, CheckCircle, X, Copy, Check } from "lucide-react";

interface Teacher {
  id: string;
  name: string;
  employeeId: string;
  department: string | null;
  subject: string | null;
  email: string | null;
  phone: string | null;
  joiningDate: string;
  status: string;
}

function statusTone(status: string) {
  return status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700";
}

export default function AllTeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [resetResult, setResetResult] = useState<{ name: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .get<Teacher[]>("/teachers")
      .then(setTeachers)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load teachers"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = (teachers || []).filter((t) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return t.name.toLowerCase().includes(q) || t.employeeId.toLowerCase().includes(q) || (t.department || "").toLowerCase().includes(q);
  });

  async function handleReset(teacher: Teacher) {
    if (!confirm(`Generate a new temporary password for ${teacher.name}? Their current password will stop working immediately.`)) return;
    setBusyId(teacher.id);
    try {
      const res = await api.post<{ temporaryPassword: string }>(`/teachers/${teacher.id}/reset-password`);
      setResetResult({ name: teacher.name, password: res.temporaryPassword });
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Failed to reset password");
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggleStatus(teacher: Teacher) {
    const activating = teacher.status !== "ACTIVE";
    const label = activating ? "enable" : "disable";
    if (!confirm(`Are you sure you want to ${label} ${teacher.name}'s account?`)) return;
    setBusyId(teacher.id);
    try {
      await api.patch(`/teachers/${teacher.id}/${activating ? "activate" : "deactivate"}`);
      setTeachers((prev) => prev?.map((t) => (t.id === teacher.id ? { ...t, status: activating ? "ACTIVE" : "INACTIVE" } : t)) || null);
    } catch (e) {
      alert(e instanceof ApiError ? e.message : `Failed to ${label} account`);
    } finally {
      setBusyId(null);
    }
  }

  function copyPassword() {
    if (!resetResult) return;
    navigator.clipboard.writeText(resetResult.password).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <AdminShell>
      <div className="ledger-bg border-b border-neutral-200 bg-white px-6 py-6 md:px-8">
        <p className="font-mono text-xs uppercase tracking-widest text-academic">Admin Portal</p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-academic" />
            <h1 className="font-display text-2xl font-bold text-navy">All Teachers</h1>
          </div>
          <Link
            href="/admin/teachers/new"
            className="inline-flex items-center gap-1.5 rounded-md bg-academic px-4 py-2 text-sm font-medium text-white transition hover:bg-academic-light"
          >
            <UserCog className="h-4 w-4" />
            Add Teacher
          </Link>
        </div>
      </div>

      <div className="p-6 md:p-8">
        <div className="mb-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, employee ID, or department…"
            className="w-full max-w-sm rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-academic focus:outline-none focus:ring-1 focus:ring-academic"
          />
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-neutral-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading teachers…
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-red-200 bg-red-50 py-10 text-center">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <p className="text-sm text-red-600">{error}</p>
            <button onClick={load} className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 underline">
              <RefreshCw className="h-3 w-3" />
              Retry
            </button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-neutral-200 bg-white py-16 text-center text-neutral-400">
            <GraduationCap className="h-8 w-8" />
            <p className="text-sm text-neutral-500">{search ? "No teachers match your search." : "No teachers added yet."}</p>
            {!search && (
              <Link href="/admin/teachers/new" className="text-sm font-medium text-academic hover:underline">
                Add your first teacher
              </Link>
            )}
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white shadow-sm">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-neutral-100 text-xs uppercase tracking-wide text-neutral-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Employee ID</th>
                  <th className="px-5 py-3 font-medium">Department</th>
                  <th className="px-5 py-3 font-medium">Subject</th>
                  <th className="px-5 py-3 font-medium">Contact</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map((t) => (
                  <tr key={t.id}>
                    <td className="px-5 py-3 font-medium text-navy">{t.name}</td>
                    <td className="px-5 py-3 font-mono text-xs text-neutral-600">{t.employeeId}</td>
                    <td className="px-5 py-3 text-neutral-600">{t.department || "—"}</td>
                    <td className="px-5 py-3 text-neutral-600">{t.subject || "—"}</td>
                    <td className="px-5 py-3 text-neutral-600">{t.phone || t.email || "—"}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusTone(t.status)}`}>{t.status}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleReset(t)}
                          disabled={busyId === t.id}
                          title="Reset password"
                          className="inline-flex items-center gap-1 rounded-md border border-neutral-200 px-2 py-1 text-xs text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-50"
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                          Reset
                        </button>
                        <button
                          onClick={() => handleToggleStatus(t)}
                          disabled={busyId === t.id}
                          title={t.status === "ACTIVE" ? "Disable account" : "Enable account"}
                          className="inline-flex items-center gap-1 rounded-md border border-neutral-200 px-2 py-1 text-xs text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-50"
                        >
                          {t.status === "ACTIVE" ? <Ban className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}
                          {t.status === "ACTIVE" ? "Disable" : "Enable"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {resetResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold text-navy">Password Reset</h3>
              <button onClick={() => setResetResult(null)} aria-label="Close">
                <X className="h-4 w-4 text-neutral-400" />
              </button>
            </div>
            <p className="mb-3 text-sm text-neutral-500">
              New temporary password for <span className="font-medium text-navy">{resetResult.name}</span>:
            </p>
            <div className="mb-3 flex items-center justify-between rounded-md bg-neutral-50 px-3 py-2">
              <span className="font-mono font-bold text-academic">{resetResult.password}</span>
              <button onClick={copyPassword} className="text-neutral-500 hover:text-navy">
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-gold-dark">Share this with the teacher securely — it won&apos;t be shown again.</p>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
