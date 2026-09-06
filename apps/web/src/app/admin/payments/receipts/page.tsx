"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { api, downloadFile } from "@/lib/api-client";
import { FEE_TYPES, OFFLINE_METHODS, formatCurrency, formatDate, humanize } from "@/lib/fees";
import { Loader2, Search, Receipt, Download } from "lucide-react";

interface Ref {
  id: string;
  name: string;
}
interface ReceiptRow {
  id: string;
  student: { id: string; name: string; studentId: string; admissionNumber: string } | null;
  class: { id: string; name: string } | null;
  section: { id: string; name: string } | null;
  feeType: string | null;
  amount: number;
  method: string;
  paymentCategory?: string;
  gateway: string;
  createdAt: string;
  receiptNumber: string | null;
}

export default function AdminReceiptsPage() {
  const [classes, setClasses] = useState<Ref[]>([]);
  const [sections, setSections] = useState<Ref[]>([]);
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [feeType, setFeeType] = useState("");
  const [method, setMethod] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");

  const [rows, setRows] = useState<ReceiptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

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
    if (search) params.set("search", search);
    if (classId) params.set("classId", classId);
    if (sectionId) params.set("sectionId", sectionId);
    if (feeType) params.set("feeType", feeType);
    if (method) params.set("method", method);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    const timeout = setTimeout(() => {
      api
        .get<ReceiptRow[]>(`/payments/receipts?${params.toString()}`)
        .then(setRows)
        .catch((e) => setError(e.message || "Failed to load receipts"))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timeout);
  }, [search, classId, sectionId, feeType, method, dateFrom, dateTo]);

  async function download(r: ReceiptRow) {
    setDownloadingId(r.id);
    try {
      await downloadFile(`/payments/${r.id}/receipt/pdf`, `${r.receiptNumber || r.id}.pdf`);
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <AdminShell>
      <div className="ledger-bg border-b border-neutral-200 bg-white px-8 py-6">
        <p className="font-mono text-xs uppercase tracking-widest text-academic">Fees & Payments</p>
        <h1 className="font-display text-2xl font-bold text-navy">Receipts</h1>
      </div>

      <div className="p-8">
        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
          <div className="relative col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student…"
              className="w-full rounded-md border border-neutral-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-academic"
            />
          </div>
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
          <select value={method} onChange={(e) => setMethod(e.target.value)} className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm">
            <option value="">All methods</option>
            <option value="RAZORPAY">Razorpay / Online</option>
            {OFFLINE_METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-md border border-neutral-300 px-3 py-2 text-sm" />
        </div>

        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-5 py-3 font-medium">Receipt No.</th>
                <th className="px-5 py-3 font-medium">Student</th>
                <th className="px-5 py-3 font-medium">Class / Section</th>
                <th className="px-5 py-3 font-medium">Fee</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Method</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading && (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-neutral-500">
                    <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                    Loading receipts…
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-red-600">
                    {error}
                  </td>
                </tr>
              )}
              {!loading && !error && rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center text-neutral-500">
                    <Receipt className="mx-auto mb-2 h-6 w-6 text-neutral-300" />
                    No receipts found for these filters.
                  </td>
                </tr>
              )}
              {!loading &&
                !error &&
                rows.map((r) => (
                  <tr key={r.id} className="hover:bg-neutral-50">
                    <td className="px-5 py-3 font-mono text-xs text-neutral-600">{r.receiptNumber ?? "—"}</td>
                    <td className="px-5 py-3 font-medium text-navy">{r.student?.name ?? "—"}</td>
                    <td className="px-5 py-3">
                      {r.class?.name ?? "—"} {r.section?.name ? `- ${r.section.name}` : ""}
                    </td>
                    <td className="px-5 py-3">{humanize(r.feeType)}</td>
                    <td className="px-5 py-3 font-medium">{formatCurrency(r.amount)}</td>
                    <td className="px-5 py-3">{r.gateway === "RAZORPAY" ? "Online" : `Offline · ${humanize(r.method)}`}</td>
                    <td className="px-5 py-3 text-neutral-500">{formatDate(r.createdAt)}</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => download(r)}
                        disabled={downloadingId === r.id}
                        className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-navy hover:bg-neutral-50 disabled:opacity-50"
                      >
                        {downloadingId === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                        Download
                      </button>
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
