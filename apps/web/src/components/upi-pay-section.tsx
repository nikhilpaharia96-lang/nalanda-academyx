"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Smartphone } from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { formatCurrency, humanize } from "@/lib/fees";

interface Fee { id: string; remainingAmount: number; status: string; title?: string; feeType?: string | null; month?: number | null; year?: number }
interface Claim { id: string; studentId: string; utr: string; amount: number; status: string; note: string | null; createdAt: string }
type MatchResult = { matched: boolean; message?: string };

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  PENDING: { text: "Waiting for bank confirmation", cls: "bg-amber-50 text-amber-700" },
  APPROVED: { text: "Approved — fee paid", cls: "bg-emerald-50 text-emerald-700" },
  REJECTED: { text: "Rejected", cls: "bg-red-50 text-red-700" },
  NEEDS_REVIEW: { text: "Under review by the office", cls: "bg-blue-50 text-blue-700" },
};

function feeTitle(f: Fee) {
  if (f.title) return f.title;
  const m = f.month ? ` — ${new Date(2000, f.month - 1, 1).toLocaleString("en-IN", { month: "long" })} ${f.year}` : "";
  return `${humanize(f.feeType ?? "Fee")}${m}`;
}

/** "I paid by UPI" — the family enters the UTR + amount; the office's bank-statement entry approves it automatically. */
export function UpiPaySection({ monthlyFees, extraFees, studentId, onDone }: { monthlyFees: Fee[]; extraFees: Fee[]; studentId?: string; onDone: () => void }) {
  const options = useMemo(
    () => [
      ...monthlyFees.filter((f) => f.status !== "PAID" && f.status !== "WAIVED").map((f) => ({ key: `m:${f.id}`, label: feeTitle(f), remaining: f.remainingAmount })),
      ...extraFees.filter((f) => f.status !== "PAID" && f.status !== "WAIVED").map((f) => ({ key: `e:${f.id}`, label: feeTitle(f), remaining: f.remainingAmount })),
    ],
    [monthlyFees, extraFees],
  );
  const [claims, setClaims] = useState<Claim[] | null>(null);
  const [sel, setSel] = useState("");
  const [amount, setAmount] = useState("");
  const [utr, setUtr] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const loadClaims = useCallback(() => {
    api.get<Claim[]>("/upi/claims/mine").then((all) => setClaims(studentId ? all.filter((c) => c.studentId === studentId) : all)).catch(() => setClaims([]));
  }, [studentId]);
  useEffect(loadClaims, [loadClaims]);

  useEffect(() => {
    if (!options.find((o) => o.key === sel)) {
      setSel(options[0]?.key ?? "");
      setAmount(options[0] ? String(options[0].remaining) : "");
    }
  }, [options, sel]);

  if (options.length === 0 && (claims?.length ?? 0) === 0) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const [kind, id] = sel.split(":");
      const r = await api.post<{ match: MatchResult }>("/upi/claims", {
        studentFeeId: kind === "m" ? id : undefined,
        extraFeeId: kind === "e" ? id : undefined,
        utr: utr.trim(),
        amount: Number(amount),
      });
      setUtr("");
      setMsg({ ok: true, text: r.match.matched ? "Payment verified and your fee is marked paid." : "UTR submitted. It will be approved automatically once the school sees the payment in its bank account." });
      loadClaims();
      onDone();
    } catch (err) {
      setMsg({ ok: false, text: err instanceof ApiError ? err.message : "Could not submit. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Paid via UPI? Submit your UTR</h2>
      <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
        {options.length > 0 && (
          <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-medium text-neutral-700 sm:col-span-2">
              Fee
              <select className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-base" value={sel} onChange={(e) => { setSel(e.target.value); setAmount(String(options.find((o) => o.key === e.target.value)?.remaining ?? "")); }}>
                {options.map((o) => <option key={o.key} value={o.key}>{o.label} — due {formatCurrency(o.remaining)}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium text-neutral-700">
              Amount paid (₹)
              <input type="number" min="1" step="0.01" required className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-base" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </label>
            <label className="block text-sm font-medium text-neutral-700">
              UTR / Transaction ID
              <input required className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 font-mono text-base uppercase" placeholder="e.g. 412345678901" value={utr} onChange={(e) => setUtr(e.target.value)} />
            </label>
            <div className="sm:col-span-2">
              <button disabled={busy || !utr.trim() || !(Number(amount) > 0)} className="inline-flex items-center gap-2 rounded-md bg-navy px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />} Submit UTR
              </button>
              <p className="mt-2 text-xs text-neutral-500">Pay to the school&rsquo;s UPI first, then enter the 12-digit UTR from your payment app. Only an exact UTR + amount match is approved.</p>
            </div>
          </form>
        )}
        {msg && <p className={`mt-3 rounded-md px-3 py-2 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{msg.text}</p>}
        {claims && claims.length > 0 && (
          <ul className="mt-4 divide-y divide-neutral-100 text-sm">
            {claims.slice(0, 8).map((c) => {
              const s = STATUS_LABEL[c.status] ?? { text: c.status, cls: "bg-neutral-100 text-neutral-700" };
              return (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span><span className="font-mono">{c.utr}</span> · {formatCurrency(c.amount)}{c.note && c.status !== "APPROVED" ? <span className="block text-xs text-neutral-500">{c.note}</span> : null}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${s.cls}`}>{s.text}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
