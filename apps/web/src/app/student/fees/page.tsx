"use client";

import { useCallback, useEffect, useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import { useAuth } from "@/lib/auth-context";
import { api, downloadFile } from "@/lib/api-client";
import { payFee } from "@/lib/razorpay";
import { STUDENT_NAV } from "@/lib/student-nav";
import { formatCurrency, formatDate, humanize, statusBadgeClass } from "@/lib/fees";
import { Loader2, Receipt as ReceiptIcon, Download, X } from "lucide-react";

interface StudentFee {
  id: string;
  month: number | null;
  year: number;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string;
  status: string;
  feeType: string | null;
}
interface ExtraFee {
  id: string;
  title: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string;
  status: string;
}
interface FeesResponse {
  monthlyFees: StudentFee[];
  extraFees: ExtraFee[];
}
interface Payment {
  id: string;
  amount: number;
  status: string;
  paidAt: string | null;
  method: string | null;
  gateway: string;
  createdAt: string;
}
interface ReceiptData {
  school: { name: string; address: string | null; phone: string | null; email: string | null };
  receiptNumber: string | null;
  student: { name: string; admissionNumber: string } | null;
  class: string | null;
  section: string | null;
  feeType: string | null;
  feeMonth: number | null;
  amount: number;
  totalFeeAmount: number | null;
  paidToDate: number | null;
  remainingAfterThisPayment: number | null;
  paymentCategory: string;
  method: string | null;
  transactionId: string | null;
  paymentDate: string | null;
  status: string;
  paymentId: string;
}

export default function StudentFeesPage() {
  const { user } = useAuth();
  const [fees, setFees] = useState<FeesResponse | null>(null);
  const [payments, setPayments] = useState<Payment[] | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  const load = useCallback(() => {
    if (!user?.profileId) return;
    api.get<FeesResponse>(`/fees/student/${user.profileId}`).then(setFees);
    api.get<Payment[]>("/payments/mine").then(setPayments);
  }, [user?.profileId]);

  useEffect(load, [load]);

  async function handlePay(kind: "monthly" | "extra", fee: StudentFee | ExtraFee) {
    const remaining = fee.remainingAmount;
    setPayingId(fee.id);
    setMessage(null);
    await payFee({
      studentFeeId: kind === "monthly" ? fee.id : undefined,
      extraFeeId: kind === "extra" ? fee.id : undefined,
      amount: remaining,
      studentName: user?.email ?? "Student",
      studentEmail: user?.email,
      onSuccess: () => {
        setMessage({ type: "success", text: "Payment successful! Your receipt is now available below." });
        setPayingId(null);
        load();
      },
      onError: (msg) => {
        setMessage({ type: "error", text: msg });
        setPayingId(null);
      },
    });
  }

  async function viewReceipt(paymentId: string) {
    const data = await api.get<ReceiptData>(`/payments/${paymentId}/receipt`);
    setReceipt(data);
  }

  async function downloadReceipt(p: Payment) {
    setDownloadingId(p.id);
    try {
      await downloadFile(`/payments/${p.id}/receipt/pdf`, `receipt-${p.id}.pdf`);
    } catch {
      setMessage({ type: "error", text: "Could not download the receipt. Please try again." });
    } finally {
      setDownloadingId(null);
    }
  }

  const pendingMonthly = fees?.monthlyFees.filter((f) => f.status !== "PAID" && f.status !== "WAIVED") ?? [];
  const pendingExtra = fees?.extraFees.filter((f) => f.status !== "PAID" && f.status !== "WAIVED") ?? [];

  return (
    <PortalShell navItems={STUDENT_NAV} loginPath="/student/login" allowedRoles={["STUDENT"]} portalLabel="Student Portal">
      <div className="ledger-bg border-b border-neutral-200 bg-white px-6 py-6 sm:px-8">
        <p className="font-mono text-xs uppercase tracking-widest text-academic">Student Portal</p>
        <h1 className="font-display text-2xl font-bold text-navy">Fees &amp; Payments</h1>
      </div>

      <div className="space-y-8 p-6 sm:p-8">
        {message && (
          <p className={`rounded-md px-4 py-3 text-sm ${message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{message.text}</p>
        )}

        {!fees && (
          <div className="flex items-center gap-2 text-neutral-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading fees…
          </div>
        )}

        {fees && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Pending &amp; Overdue</h2>
            {pendingMonthly.length === 0 && pendingExtra.length === 0 ? (
              <p className="rounded-lg border border-neutral-200 bg-white p-6 text-sm text-neutral-500">No pending fees. You&rsquo;re all caught up.</p>
            ) : (
              <div className="space-y-2">
                {pendingMonthly.map((f) => (
                  <FeeRow
                    key={f.id}
                    title={`${humanize(f.feeType)}${f.month ? ` — ${new Date(2000, f.month - 1, 1).toLocaleString("en-IN", { month: "long" })} ${f.year}` : ""}`}
                    amount={f.amount}
                    paidAmount={f.paidAmount}
                    remainingAmount={f.remainingAmount}
                    dueDate={f.dueDate}
                    status={f.status}
                    onPay={() => handlePay("monthly", f)}
                    paying={payingId === f.id}
                  />
                ))}
                {pendingExtra.map((f) => (
                  <FeeRow
                    key={f.id}
                    title={f.title}
                    amount={f.amount}
                    paidAmount={f.paidAmount}
                    remainingAmount={f.remainingAmount}
                    dueDate={f.dueDate}
                    status={f.status}
                    onPay={() => handlePay("extra", f)}
                    paying={payingId === f.id}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Payment History</h2>
          {!payments && (
            <div className="flex items-center gap-2 text-neutral-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          )}
          {payments && payments.length === 0 && <p className="text-sm text-neutral-500">No payment history yet.</p>}
          <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white shadow-sm">
            {payments && payments.length > 0 && (
              <table className="w-full text-left text-sm">
                <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Amount</th>
                    <th className="px-5 py-3 font-medium">Method</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td className="px-5 py-3 font-medium text-navy">{formatCurrency(p.amount)}</td>
                      <td className="px-5 py-3 text-neutral-600">{p.gateway === "RAZORPAY" ? "Razorpay" : humanize(p.method)}</td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(p.status)}`}>{humanize(p.status)}</span>
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-neutral-500">{(p.paidAt ?? p.createdAt).slice(0, 10)}</td>
                      <td className="px-5 py-3">
                        {p.status === "PAID" && (
                          <div className="flex items-center gap-3">
                            <button onClick={() => viewReceipt(p.id)} className="flex items-center gap-1 text-xs font-medium text-academic hover:underline">
                              <ReceiptIcon className="h-3.5 w-3.5" /> View
                            </button>
                            <button
                              onClick={() => downloadReceipt(p)}
                              disabled={downloadingId === p.id}
                              className="flex items-center gap-1 text-xs font-medium text-academic hover:underline disabled:opacity-50"
                            >
                              {downloadingId === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                              Download
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>

      {receipt && <ReceiptModal receipt={receipt} onClose={() => setReceipt(null)} onDownload={() => downloadFile(`/payments/${receipt.paymentId}/receipt/pdf`, `receipt-${receipt.paymentId}.pdf`)} />}
    </PortalShell>
  );
}

function FeeRow({
  title,
  amount,
  paidAmount,
  remainingAmount,
  dueDate,
  status,
  onPay,
  paying,
}: {
  title: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string;
  status: string;
  onPay: () => void;
  paying: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium text-navy">{title}</p>
        <p className="text-xs text-neutral-500">
          Due {formatDate(dueDate)}
          {paidAmount > 0 && <span className="ml-2 text-blue-600">· {formatCurrency(paidAmount)} already paid</span>}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(status)}`}>{humanize(status)}</span>
        <span className="font-display font-bold text-navy">{formatCurrency(remainingAmount)}</span>
        <button onClick={onPay} disabled={paying} className="flex items-center gap-1.5 rounded-md bg-gold px-4 py-2 text-sm font-semibold text-navy transition hover:bg-gold-light disabled:opacity-60">
          {paying && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Pay Now
        </button>
      </div>
    </div>
  );
}

function ReceiptModal({ receipt, onClose, onDownload }: { receipt: ReceiptData; onClose: () => void; onDownload: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="font-display text-lg font-bold text-navy">{receipt.school.name}</p>
            <p className="font-mono text-xs text-neutral-500">{receipt.receiptNumber}</p>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-navy">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-2 text-sm">
          {receipt.student && <Row label="Student" value={receipt.student.name} />}
          {receipt.student && <Row label="Admission No." value={receipt.student.admissionNumber} />}
          {receipt.class && <Row label="Class" value={`${receipt.class}${receipt.section ? " — " + receipt.section : ""}`} />}
          {receipt.feeType && <Row label="Fee Type" value={humanize(receipt.feeType)} />}
          {receipt.feeMonth && <Row label="Month" value={String(receipt.feeMonth)} />}
          <Row label="Amount Paid" value={formatCurrency(receipt.amount)} />
          {receipt.remainingAfterThisPayment !== null && receipt.remainingAfterThisPayment > 0.01 && (
            <Row label="Remaining Balance" value={formatCurrency(receipt.remainingAfterThisPayment)} />
          )}
          <Row label="Payment Method" value={receipt.paymentCategory === "Offline" ? `Offline — ${humanize(receipt.method)}` : "Online — Razorpay"} />
          <Row label="Transaction ID" value={receipt.transactionId ?? "—"} mono />
          <Row label="Date" value={receipt.paymentDate?.slice(0, 10) ?? "—"} />
          <div className="mt-4 rounded-md bg-emerald-50 py-2 text-center font-semibold text-emerald-700">{humanize(receipt.status)}</div>
          <button onClick={onDownload} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border border-neutral-300 py-2 text-sm font-medium text-navy hover:bg-neutral-50">
            <Download className="h-4 w-4" /> Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between border-b border-neutral-100 pb-1.5">
      <span className="text-neutral-500">{label}</span>
      <span className={`text-navy ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
    </div>
  );
}
