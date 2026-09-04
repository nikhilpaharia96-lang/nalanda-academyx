"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { StatusBadge } from "@/components/fees/StatusBadge";
import { api } from "@/lib/api-client";
import { FEE_TYPES, formatCurrency, formatDate, humanize } from "@/lib/fees";
import { Loader2, AlertCircle } from "lucide-react";

interface Ref {
  id: string;
  name: string;
}
interface PendingRow {
  studentFeeId: string;
  student: { id: string; name: string; studentId: string; admissionNumber: string };
  class: { id: string; name: string };
  section: { id: string; name: string };
  feeType: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string;
  status: string;
}

export default function PendingFeesPage() {
  const [classes, setClasses] = useState<Ref[]>([]);
  const [sections, setSections] = useState<Ref[]>([]);
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [feeType, setFeeType] = useState("");
  const [dueDateFrom, setDueDateFrom] = useState("");
  const [dueDateTo, setDueDateTo] = useState("");

  const [rows, setRows] = useState<PendingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<Ref[]>("/classes").then(setClasses).catch(() => {});
  }, []);
  useEffect(() => {
    if (!classId) {
      setSections([]);
      setSectionId("");
      return;
    }
    api.get<Ref[]>(`/sections?classId=${classId}`).then(setSections).catch(() => {});
  }, [classId]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (classId) params.set("classId", classId);
    if (sectionId) params.set("sectionId", sectionId);
    if (feeType) params.set("feeType", feeType);
    if (dueDateFrom) params.set("dueDateFrom", dueDateFrom);
    if (dueDateTo) params.set("dueDateTo", dueDateTo);
    api
      .get<PendingRow[]>(`/fees/pending?${params.toString()}`)
      .then(setRows)
      .catch((e) => setError(e.message || "Failed to load pending fees"))
      .finally(() => setLoading(false));
  }, [classId, sectionId, feeType, dueDateFrom, dueDateTo]);

  const totalDue = rows.reduce((s, r) => s + r.remainingAmount, 0);

  return (
    <AdminShell>
      <div className="ledger-bg border-b border-neutral-200 bg-white px-8 py-6">
        <p className="font-mono text-xs uppercase tracking-widest text-academic">Fees & Payments</p>
        <h1 className="font-display text-2xl font-bold text-navy">Pending Fees</h1>
      </div>

      <div className="p-8">
        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
          <select value={classId} onChange={(e) => setClassId(e.target.value)} className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm">
            <option value="">All classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} disabled={!classId} className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm disabled:bg-neutral-100">
            <option value="">All sections</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
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
          <input type="date" value={dueDateFrom} onChange={(e) => setDueDateFrom(e.target.value)} className="rounded-md border border-neutral-300 px-3 py-2 text-sm" placeholder="Due from" />
          <input type="date" value={dueDateTo} onChange={(e) => setDueDateTo(e.target.value)} className="rounded-md border border-neutral-300 px-3 py-2 text-sm" placeholder="Due to" />
        </div>

        {!loading && !error && rows.length > 0 && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <strong>{rows.length}</strong> unpaid fee record{rows.length === 1 ? "" : "s"} totalling <strong>{formatCurrency(totalDue)}</strong> remaining.
          </div>
        )}

        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-5 py-3 font-medium">Student</th>
                <th className="px-5 py-3 font-medium">Class</th>
                <th className="px-5 py-3 font-medium">Section</th>
                <th className="px-5 py-3 font-medium">Fee</th>
                <th className="px-5 py-3 font-medium">Amount Due</th>
                <th className="px-5 py-3 font-medium">Due Date</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-neutral-500">
                    <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-red-600">
                    {error}
                  </td>
                </tr>
              )}
              {!loading && !error && rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-neutral-500">
                    <AlertCircle className="mx-auto mb-2 h-6 w-6 text-neutral-300" />
                    No pending fees for these filters — everyone&apos;s paid up.
                  </td>
                </tr>
              )}
              {!loading &&
                !error &&
                rows.map((r) => (
                  <tr key={r.studentFeeId} className="hover:bg-neutral-50">
                    <td className="px-5 py-3 font-medium text-navy">{r.student.name}</td>
                    <td className="px-5 py-3">{r.class.name}</td>
                    <td className="px-5 py-3">{r.section.name}</td>
                    <td className="px-5 py-3">{humanize(r.feeType)}</td>
                    <td className="px-5 py-3 font-medium">
                      {formatCurrency(r.remainingAmount)}
                      {r.paidAmount > 0 && <span className="ml-1 text-xs font-normal text-neutral-400">of {formatCurrency(r.amount)}</span>}
                    </td>
                    <td className="px-5 py-3 text-neutral-500">{formatDate(r.dueDate)}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
