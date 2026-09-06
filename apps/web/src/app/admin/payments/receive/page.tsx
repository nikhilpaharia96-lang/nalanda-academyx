"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { api, ApiError } from "@/lib/api-client";
import { OFFLINE_METHODS, formatCurrency, formatDate, humanize } from "@/lib/fees";
import { Search, Loader2, CheckCircle2, UserRound } from "lucide-react";

interface StudentHit {
  id: string;
  studentId: string;
  admissionNumber: string;
  name: string;
  classId: string;
  sectionId: string;
}
interface UnpaidFee {
  id: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string;
  status: string;
  feeType: string | null;
  frequency: string | null;
  month?: number | null;
  kind: "monthlyFee" | "extraFee";
  title?: string;
}

export default function ReceivePaymentPage() {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<StudentHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [student, setStudent] = useState<StudentHit | null>(null);

  const [fees, setFees] = useState<UnpaidFee[]>([]);
  const [feesLoading, setFeesLoading] = useState(false);
  const [selectedFee, setSelectedFee] = useState<UnpaidFee | null>(null);

  const [amount, setAmount] = useState("");
  const [gateway, setGateway] = useState("OFFLINE_CASH");
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10));
  const [referenceNote, setReferenceNote] = useState("");
  const [chequeNumber, setChequeNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [receivedByName, setReceivedByName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ receiptNumber: string; paymentId: string } | null>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setHits([]);
      return;
    }
    setSearching(true);
    const timeout = setTimeout(() => {
      api
        .get<{ data: StudentHit[] }>(`/students?search=${encodeURIComponent(query)}&pageSize=8`)
        .then((r) => setHits(r.data))
        .catch(() => setHits([]))
        .finally(() => setSearching(false));
    }, 250);
    return () => clearTimeout(timeout);
  }, [query]);

  function selectStudent(s: StudentHit) {
    setStudent(s);
    setHits([]);
    setQuery("");
    setSelectedFee(null);
    setFeesLoading(true);
    api
      .get<{ monthlyFees: any[]; extraFees: any[] }>(`/fees/student/${s.id}`)
      .then((res) => {
        const unpaidStatuses = ["PENDING", "PARTIALLY_PAID", "OVERDUE"];
        const monthly: UnpaidFee[] = res.monthlyFees
          .filter((f) => unpaidStatuses.includes(f.status))
          .map((f) => ({ ...f, kind: "monthlyFee" as const }));
        const extra: UnpaidFee[] = res.extraFees
          .filter((f) => unpaidStatuses.includes(f.status))
          .map((f) => ({ ...f, kind: "extraFee" as const, feeType: f.title }));
        setFees([...monthly, ...extra]);
      })
      .catch(() => setFees([]))
      .finally(() => setFeesLoading(false));
  }

  function selectFee(f: UnpaidFee) {
    setSelectedFee(f);
    setAmount(String(f.remainingAmount));
  }

  async function submit() {
    if (!student || !selectedFee) return;
    setSaving(true);
    setError(null);
    try {
      const res = await api.post<{ payment: { id: string }; receipt: { receiptNumber: string } }>("/payments/offline", {
        studentId: student.id,
        studentFeeId: selectedFee.kind === "monthlyFee" ? selectedFee.id : undefined,
        extraFeeId: selectedFee.kind === "extraFee" ? selectedFee.id : undefined,
        amount: Number(amount),
        gateway,
        referenceNote: referenceNote || undefined,
        chequeNumber: gateway === "OFFLINE_CHEQUE" ? chequeNumber : undefined,
        bankName: gateway === "OFFLINE_CHEQUE" ? bankName : undefined,
        receivedByName: receivedByName || undefined,
        paidAt: paidAt ? new Date(paidAt).toISOString() : undefined,
      });
      setSuccess({ receiptNumber: res.receipt.receiptNumber, paymentId: res.payment.id });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to record payment");
    } finally {
      setSaving(false);
    }
  }

  function resetAll() {
    setStudent(null);
    setFees([]);
    setSelectedFee(null);
    setAmount("");
    setReferenceNote("");
    setChequeNumber("");
    setBankName("");
    setReceivedByName("");
    setSuccess(null);
    setError(null);
  }

  return (
    <AdminShell>
      <div className="ledger-bg border-b border-neutral-200 bg-white px-8 py-6">
        <p className="font-mono text-xs uppercase tracking-widest text-academic">Fees & Payments</p>
        <h1 className="font-display text-2xl font-bold text-navy">Receive Payment</h1>
      </div>

      <div className="mx-auto max-w-3xl p-8">
        {success ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-8 text-center">
            <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-600" />
            <h2 className="font-display text-lg font-bold text-navy">Payment recorded successfully</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Receipt <span className="font-mono font-medium">{success.receiptNumber}</span> has been generated.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/payments/${success.paymentId}/receipt/pdf`}
                target="_blank"
                rel="noreferrer"
                className="rounded-md bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy/90"
              >
                View / Download Receipt
              </a>
              <button onClick={resetAll} className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50">
                Record Another Payment
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Step 1: Student */}
            <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-neutral-500">1. Student</h2>
              {student ? (
                <div className="flex items-center justify-between rounded-md bg-neutral-50 px-4 py-3">
                  <div>
                    <p className="font-medium text-navy">{student.name}</p>
                    <p className="font-mono text-xs text-neutral-500">
                      {student.studentId} · Admission {student.admissionNumber}
                    </p>
                  </div>
                  <button onClick={resetAll} className="text-xs font-medium text-academic hover:underline">
                    Change
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by name, student ID, or admission number…"
                    className="w-full rounded-md border border-neutral-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-academic"
                  />
                  {searching && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-neutral-400" />}
                  {hits.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-neutral-200 bg-white shadow-lg">
                      {hits.map((h) => (
                        <button
                          key={h.id}
                          onClick={() => selectStudent(h)}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-neutral-50"
                        >
                          <UserRound className="h-4 w-4 text-neutral-400" />
                          <span className="font-medium text-navy">{h.name}</span>
                          <span className="font-mono text-xs text-neutral-500">{h.studentId}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step 2: Fee */}
            {student && (
              <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
                <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-neutral-500">2. Select Unpaid Fee</h2>
                {feesLoading && <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />}
                {!feesLoading && fees.length === 0 && <p className="text-sm text-neutral-500">This student has no pending fees.</p>}
                <div className="space-y-2">
                  {fees.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => selectFee(f)}
                      className={`flex w-full items-center justify-between rounded-md border px-4 py-3 text-left text-sm transition ${
                        selectedFee?.id === f.id ? "border-academic bg-academic/5" : "border-neutral-200 hover:bg-neutral-50"
                      }`}
                    >
                      <div>
                        <p className="font-medium text-navy">{humanize(f.feeType)}</p>
                        <p className="text-xs text-neutral-500">
                          Due {formatDate(f.dueDate)} · Total {formatCurrency(f.amount)} · Paid {formatCurrency(f.paidAmount)}
                        </p>
                      </div>
                      <p className="font-display font-bold text-navy">{formatCurrency(f.remainingAmount)} due</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Payment details */}
            {selectedFee && (
              <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
                <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-neutral-500">3. Payment Details</h2>
                {error && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-neutral-600">Amount Received (₹)</label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      max={selectedFee.remainingAmount}
                      className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-academic"
                    />
                    <p className="mt-1 text-xs text-neutral-400">Max {formatCurrency(selectedFee.remainingAmount)}. Enter less to record a partial payment.</p>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-neutral-600">Payment Method</label>
                    <select value={gateway} onChange={(e) => setGateway(e.target.value)} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm">
                      {OFFLINE_METHODS.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-neutral-600">Payment Date</label>
                    <input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-neutral-600">Received By</label>
                    <input
                      value={receivedByName}
                      onChange={(e) => setReceivedByName(e.target.value)}
                      placeholder="Defaults to your account"
                      className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                    />
                  </div>

                  {gateway === "OFFLINE_CHEQUE" && (
                    <>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-neutral-600">Cheque Number</label>
                        <input value={chequeNumber} onChange={(e) => setChequeNumber(e.target.value)} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-neutral-600">Bank Name</label>
                        <input value={bankName} onChange={(e) => setBankName(e.target.value)} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
                      </div>
                    </>
                  )}

                  {(gateway === "OFFLINE_UPI" || gateway === "OFFLINE_BANK_TRANSFER") && (
                    <div className="col-span-2">
                      <label className="mb-1 block text-xs font-medium text-neutral-600">Transaction / Reference Number</label>
                      <input value={referenceNote} onChange={(e) => setReferenceNote(e.target.value)} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
                    </div>
                  )}

                  <div className="col-span-2">
                    <label className="mb-1 block text-xs font-medium text-neutral-600">Notes {gateway === "OFFLINE_OTHER" || gateway === "OFFLINE_CASH" ? "" : "(optional)"}</label>
                    {gateway !== "OFFLINE_UPI" && gateway !== "OFFLINE_BANK_TRANSFER" && (
                      <textarea value={referenceNote} onChange={(e) => setReferenceNote(e.target.value)} rows={2} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
                    )}
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={submit}
                    disabled={saving || !amount || Number(amount) <= 0}
                    className="rounded-md bg-navy px-5 py-2.5 text-sm font-medium text-white hover:bg-navy/90 disabled:opacity-50"
                  >
                    {saving ? "Recording…" : "Record Payment"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
