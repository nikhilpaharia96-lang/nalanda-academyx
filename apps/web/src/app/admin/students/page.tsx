"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { api } from "@/lib/api-client";
import { Search, Loader2, UserRound } from "lucide-react";

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

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const timeout = setTimeout(() => {
      api
        .get<StudentsResponse>(`/students?${params.toString()}`)
        .then(setResult)
        .catch((e) => setError(e.message || "Failed to load students"))
        .finally(() => setLoading(false));
    }, 250); // debounce search
    return () => clearTimeout(timeout);
  }, [search]);

  return (
    <AdminShell>
      <div className="ledger-bg border-b border-neutral-200 bg-white px-8 py-6">
        <p className="font-mono text-xs uppercase tracking-widest text-academic">Admin Portal</p>
        <h1 className="font-display text-2xl font-bold text-navy">Students</h1>
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

        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-5 py-3 font-medium">Student</th>
                <th className="px-5 py-3 font-medium">Student ID</th>
                <th className="px-5 py-3 font-medium">Admission No.</th>
                <th className="px-5 py-3 font-medium">Roll No.</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-neutral-500">
                    <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                    Loading students…
                  </td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-red-600">
                    {error}
                  </td>
                </tr>
              )}

              {!loading && !error && result?.data.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center text-neutral-500">
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
    </AdminShell>
  );
}
