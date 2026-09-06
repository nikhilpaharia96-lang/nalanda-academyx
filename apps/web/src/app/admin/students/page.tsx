"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { api, ApiError } from "@/lib/api-client";
import { Search, Loader2, UserRound, UserPlus, KeyRound, Ban, CheckCircle, X, Copy, Check } from "lucide-react";

interface Student {
  id: string;
  studentId: string;
  admissionNumber: string;
  name: string;
  rollNumber: string;
  status: string;
  classId: string;
  sectionId: string;
}

interface StudentsResponse {
  data: Student[];
  pagination: { page: number; pageSize: number; total: number };
}

export default function AdminStudentsPage() {
  const [result, setResult] = useState<StudentsResponse | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [resetResult, setResetResult] = useState<{ name: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const reload = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const timeout = setTimeout(() => {
      api
        .get<StudentsResponse>(`/students?${params.toString()}`)
        .then(setResult)
        .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load students"))
        .finally(() => setLoading(false));
    }, 250); // debounce search
    return () => clearTimeout(timeout);
  }, [search, refreshKey]);

  async function handleReset(s: Student) {
    if (!confirm(`Generate a new temporary password for ${s.name}? Their current password will stop working immediately.`)) return;
    setBusyId(s.id);
    try {
      const res = await api.post<{ temporaryPassword: string }>(`/students/${s.id}/reset-password`);
      setResetResult({ name: s.name, password: res.temporaryPassword });
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Failed to reset password");
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggleStatus(s: Student) {
    const activating = s.status !== "ACTIVE";
    const label = activating ? "enable" : "disable";
    if (!confirm(`Are you sure you want to ${label} ${s.name}'s account?`)) return;
    setBusyId(s.id);
    try {
      await api.patch(`/students/${s.id}/${activating ? "activate" : "deactivate"}`);
      reload();
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
      <div className="ledger-bg border-b border-neutral-200 bg-white px-8 py-6">
        <p className="font-mono text-xs uppercase tracking-widest text-academic">Admin Portal</p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-2xl font-bold text-navy">Students</h1>
          <Link
            href="/admin/students/new"
            className="inline-flex items-center gap-1.5 rounded-md bg-academic px-4 py-2 text-sm font-medium text-white transition hover:bg-academic-light"
          >
            <UserPlus className="h-4 w-4" />
            Add Student
          </Link>
        </div>
      </div>

      <div className="p-8">
        <div className="mb-4 flex items-center gap-3">
          <div className="relative w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, student ID, admission no."
              className="w-full rounded-md border border-neutral-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-academic"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white shadow-sm">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-5 py-3 font-medium">Student</th>
                <th className="px-5 py-3 font-medium">Student ID</th>
                <th className="px-5 py-3 font-medium">Admission No.</th>
                <th className="px-5 py-3 font-medium">Roll No.</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-neutral-500">
                    <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                    Loading students…
                  </td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-red-600">
                    {error}
                  </td>
                </tr>
              )}

              {!loading && !error && result?.data.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-neutral-500">
                    <UserRound className="mx-auto mb-2 h-6 w-6 text-neutral-300" />
                    No students found.
                  </td>
                </tr>
              )}

              {!loading &&
                !error &&
                result?.data.map((s) => (
                  <tr key={s.id} className="hover:bg-neutral-50">
                    <td className="px-5 py-3 font-medium text-navy">{s.name}</td>
                    <td className="px-5 py-3 font-mono text-xs text-neutral-600">{s.studentId}</td>
                    <td className="px-5 py-3 font-mono text-xs text-neutral-600">{s.admissionNumber}</td>
                    <td className="px-5 py-3">{s.rollNumber}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          s.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-600"
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleReset(s)}
                          disabled={busyId === s.id}
                          title="Reset password"
                          className="inline-flex items-center gap-1 rounded-md border border-neutral-200 px-2 py-1 text-xs text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-50"
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                          Reset
                        </button>
                        <button
                          onClick={() => handleToggleStatus(s)}
                          disabled={busyId === s.id}
                          title={s.status === "ACTIVE" ? "Deactivate account" : "Activate account"}
                          className="inline-flex items-center gap-1 rounded-md border border-neutral-200 px-2 py-1 text-xs text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-50"
                        >
                          {s.status === "ACTIVE" ? <Ban className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}
                          {s.status === "ACTIVE" ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {result && result.pagination.total > 0 && (
          <p className="mt-3 text-xs text-neutral-500">
            Showing {result.data.length} of {result.pagination.total} student{result.pagination.total === 1 ? "" : "s"}
          </p>
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
            <p className="text-xs text-gold-dark">Share this with the student securely — it won&apos;t be shown again.</p>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
