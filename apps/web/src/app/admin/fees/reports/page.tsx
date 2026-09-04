"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { api } from "@/lib/api-client";
import { FEE_TYPES, formatCurrency, humanize } from "@/lib/fees";
import { Loader2, IndianRupee, TrendingUp, Clock, AlertTriangle } from "lucide-react";

interface Ref {
  id: string;
  name: string;
}
interface Summary {
  totalExpected: number;
  totalCollected: number;
  totalPending: number;
  totalOverdue: number;
  totalPartiallyPaid: number;
  totalWaived: number;
  byClassSection: { classId: string; className: string; sectionId: string; sectionName: string; expected: number; collected: number; pending: number }[];
}

function SummaryCard({ label, value, icon: Icon, tone }: { label: string; value: string; icon: any; tone: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</p>
        <Icon className={`h-4 w-4 ${tone}`} />
      </div>
      <p className="font-display text-2xl font-bold text-navy">{value}</p>
    </div>
  );
}

export default function FeeReportsPage() {
  const [years, setYears] = useState<Ref[]>([]);
  const [classes, setClasses] = useState<Ref[]>([]);
  const [academicYearId, setAcademicYearId] = useState("");
  const [classId, setClassId] = useState("");
  const [feeType, setFeeType] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<Ref[]>("/academic-years").then(setYears).catch(() => {});
    api.get<Ref[]>("/classes").then(setClasses).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (academicYearId) params.set("academicYearId", academicYearId);
    if (classId) params.set("classId", classId);
    if (feeType) params.set("feeType", feeType);
    api
      .get<Summary>(`/fees/reports/summary?${params.toString()}`)
      .then(setSummary)
      .catch((e) => setError(e.message || "Failed to load report"))
      .finally(() => setLoading(false));
  }, [academicYearId, classId, feeType]);

  return (
    <AdminShell>
      <div className="ledger-bg border-b border-neutral-200 bg-white px-8 py-6">
        <p className="font-mono text-xs uppercase tracking-widest text-academic">Fees & Payments</p>
        <h1 className="font-display text-2xl font-bold text-navy">Fee Reports</h1>
      </div>

      <div className="p-8">
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3">
          <select value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)} className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm">
            <option value="">All academic years</option>
            {years.map((y) => (
              <option key={y.id} value={y.id}>
                {y.name}
              </option>
            ))}
          </select>
          <select value={classId} onChange={(e) => setClassId(e.target.value)} className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm">
            <option value="">All classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select value={feeType} onChange={(e) => setFeeType(e.target.value)} className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm">
            <option value="">All fee types</option>
            {FEE_TYPES.map((t) => (
              <option key={t} value={t}>
                {humanize(t)}
              </option>
            ))}
          </select>
        </div>

        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
          </div>
        )}
        {!loading && error && <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        {!loading && !error && summary && (
          <>
            <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              <SummaryCard label="Total Expected" value={formatCurrency(summary.totalExpected)} icon={IndianRupee} tone="text-navy" />
              <SummaryCard label="Collected" value={formatCurrency(summary.totalCollected)} icon={TrendingUp} tone="text-emerald-600" />
              <SummaryCard label="Pending" value={formatCurrency(summary.totalPending)} icon={Clock} tone="text-amber-600" />
              <SummaryCard label="Overdue" value={formatCurrency(summary.totalOverdue)} icon={AlertTriangle} tone="text-red-600" />
            </div>

            <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-neutral-500">Class / Section-wise Collection</h2>
            <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Class</th>
                    <th className="px-5 py-3 font-medium">Section</th>
                    <th className="px-5 py-3 font-medium">Expected</th>
                    <th className="px-5 py-3 font-medium">Collected</th>
                    <th className="px-5 py-3 font-medium">Pending</th>
                    <th className="px-5 py-3 font-medium">% Collected</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {summary.byClassSection.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-16 text-center text-neutral-500">
                        No fee data for these filters.
                      </td>
                    </tr>
                  )}
                  {summary.byClassSection.map((row) => (
                    <tr key={`${row.classId}-${row.sectionId}`} className="hover:bg-neutral-50">
                      <td className="px-5 py-3 font-medium text-navy">{row.className}</td>
                      <td className="px-5 py-3">{row.sectionName}</td>
                      <td className="px-5 py-3">{formatCurrency(row.expected)}</td>
                      <td className="px-5 py-3 text-emerald-700">{formatCurrency(row.collected)}</td>
                      <td className="px-5 py-3 text-amber-700">{formatCurrency(row.pending)}</td>
                      <td className="px-5 py-3 text-neutral-500">{row.expected > 0 ? `${Math.round((row.collected / row.expected) * 100)}%` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </AdminShell>
  );
}
