"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, Clock, Loader2, Smartphone, X } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { api } from "@/lib/api-client";
import { formatCurrency, formatDate } from "@/lib/fees";
import { Empty, ErrorBox, PageHeader, Spinner, errMsg, ghostBtn, inputClass, primaryBtn } from "@/components/campus-ui";

interface Claim { id: string; utr: string; amount: number; status: string; note: string | null; studentName: string | null; createdAt: string }
interface Credit { id: string; utr: string; amount: number; claimId: string | null; createdAt: string }
interface Match { matched: boolean; reason?: string; message?: string }

export default function AdminUpiPage() {
  const [claims, setClaims] = useState<Claim[] | null>(null);
  const [credits, setCredits] = useState<Credit[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [utr, setUtr] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ tone: "ok" | "warn" | "wait"; text: string } | null>(null);

  const load = useCallback(() => {
    api.get<Claim[]>("/upi/claims").then(setClaims).catch((e) => setError(errMsg(e, "Failed to load")));
    api.get<Credit[]>("/upi/credits").then(setCredits).catch(() => setCredits([]));
  }, []);
  useEffect(load, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    try {
      const r = await api.post<{ match: Match }>("/upi/credits", { utr: utr.trim(), amount: Number(amount) });
      const m = r.match;
      if (m.matched) setResult({ tone: "ok", text: "Matched! The payment was approved automatically and the fee is marked paid." });
      else setResult({ tone: m.reason === "AMOUNT_MISMATCH" || m.reason === "NEEDS_REVIEW" ? "warn" : "wait", text: m.message ?? "Saved." });
      setUtr("");
      setAmount("");
      load();
    } catch (err) {
      setResult({ tone: "warn", text: errMsg(err, "Could not save") });
    } finally {
      setBusy(false);
    }
  }

  async function reject(c: Claim) {
    const reason = prompt(`Reject UTR ${c.utr}? Optional reason:`);
    if (reason === null) return;
    try { await api.post(`/upi/claims/${c.id}/reject`, { reason }); load(); } catch (e) { setError(errMsg(e)); }
  }

  const tone = { ok: "bg-emerald-50 text-emerald-800", warn: "bg-amber-50 text-amber-800", wait: "bg-blue-50 text-blue-800" };
  const pending = claims?.filter((c) => c.status === "PENDING" || c.status === "NEEDS_REVIEW") ?? [];

  return (
    <AdminShell>
      <PageHeader title="UPI Auto-Approval" icon={Smartphone} />
      <div className="space-y-6 p-4 sm:p-6 md:p-8">
        <section className="rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="font-display text-base font-semibold text-navy">Enter a payment you received</h2>
          <p className="mt-1 max-w-2xl text-sm text-neutral-600">
            Type the UTR and amount from your bank / UPI statement. If a parent or student has submitted the same UTR with the same amount, it is approved automatically and their fee is marked paid.
            If nobody has submitted it yet, it waits and approves as soon as they do.
          </p>
          <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-[1fr_180px_auto] sm:items-end">
            <label className="block text-sm font-medium text-neutral-700">UTR number
              <input required className={`${inputClass} mt-1 font-mono uppercase`} value={utr} onChange={(e) => setUtr(e.target.value)} placeholder="412345678901" />
            </label>
            <label className="block text-sm font-medium text-neutral-700">Amount (₹)
              <input required type="number" min="1" step="0.01" className={`${inputClass} mt-1`} value={amount} onChange={(e) => setAmount(e.target.value)} />
            </label>
            <button className={primaryBtn} disabled={busy || !utr.trim() || !(Number(amount) > 0)}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Match &amp; approve
            </button>
          </form>
          {result && <p className={`mt-3 flex items-start gap-2 rounded-md px-3 py-2 text-sm ${tone[result.tone]}`}>
            {result.tone === "ok" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : result.tone === "warn" ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> : <Clock className="mt-0.5 h-4 w-4 shrink-0" />}{result.text}
          </p>}
        </section>

        {error && <ErrorBox message={error} />}

        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">Waiting for a matching bank entry ({pending.length})</h2>
          {!claims ? <Spinner /> : pending.length === 0 ? <Empty text="No pending UTR claims." /> : (
            <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead className="bg-neutral-50 text-xs uppercase text-neutral-500"><tr><th className="px-4 py-2">Student</th><th className="px-4 py-2">UTR</th><th className="px-4 py-2">Claimed</th><th className="px-4 py-2">Note</th><th className="px-4 py-2"></th></tr></thead>
                <tbody className="divide-y divide-neutral-200">
                  {pending.map((c) => (
                    <tr key={c.id}>
                      <td className="px-4 py-2">{c.studentName ?? "—"}</td>
                      <td className="px-4 py-2 font-mono">{c.utr}</td>
                      <td className="px-4 py-2">{formatCurrency(c.amount)}</td>
                      <td className="px-4 py-2 text-xs text-neutral-500">{c.note ?? "Waiting for bank entry"}</td>
                      <td className="px-4 py-2 text-right"><button className={ghostBtn} onClick={() => reject(c)}><X className="h-3.5 w-3.5 text-red-600" /> Reject</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">Recent bank entries</h2>
          {!credits ? <Spinner /> : credits.length === 0 ? <Empty text="Nothing entered yet." /> : (
            <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="bg-neutral-50 text-xs uppercase text-neutral-500"><tr><th className="px-4 py-2">Date</th><th className="px-4 py-2">UTR</th><th className="px-4 py-2">Amount</th><th className="px-4 py-2">Status</th></tr></thead>
                <tbody className="divide-y divide-neutral-200">
                  {credits.slice(0, 50).map((c) => (
                    <tr key={c.id}>
                      <td className="px-4 py-2">{formatDate(c.createdAt)}</td>
                      <td className="px-4 py-2 font-mono">{c.utr}</td>
                      <td className="px-4 py-2">{formatCurrency(c.amount)}</td>
                      <td className="px-4 py-2">{c.claimId ? <span className="text-emerald-700">Matched &amp; approved</span> : <span className="text-neutral-500">Waiting for a claim</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
