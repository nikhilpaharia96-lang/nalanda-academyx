"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { Modal } from "@/components/modal";
import { api, ApiError } from "@/lib/api-client";
import { Plus, Loader2, Percent } from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discountType: "PERCENT" | "FLAT";
  discountValue: number;
  minOrderAmount: number | null;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
}

const emptyForm = { code: "", description: "", discountType: "PERCENT" as "PERCENT" | "FLAT", discountValue: "", minOrderAmount: "", maxUses: "" };

export default function AdminStoreCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    api.get<Coupon[]>("/store/coupons").then(setCoupons).catch(() => {});
  };
  useEffect(load, []);

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.post("/store/coupons", {
        code: form.code,
        description: form.description || undefined,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : undefined,
        maxUses: form.maxUses ? Number(form.maxUses) : undefined,
      });
      setShowCreate(false);
      setForm(emptyForm);
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not create coupon");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (c: Coupon) => {
    await api.patch(`/store/coupons/${c.id}`, { active: !c.active });
    load();
  };

  return (
    <AdminShell>
      <div className="ledger-bg flex items-center justify-between border-b border-neutral-200 bg-white px-8 py-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-academic">School Store</p>
          <h1 className="font-display text-2xl font-bold text-navy">Coupons / Discounts</h1>
        </div>
        <button
          onClick={() => {
            setForm(emptyForm);
            setError(null);
            setShowCreate(true);
          }}
          className="flex items-center gap-1.5 rounded-md bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy/90"
        >
          <Plus className="h-4 w-4" /> Add Coupon
        </button>
      </div>

      <div className="p-8">
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-left text-xs uppercase text-neutral-500">
                <th className="px-5 py-3">Code</th>
                <th className="px-5 py-3">Discount</th>
                <th className="px-5 py-3">Min Order</th>
                <th className="px-5 py-3">Usage</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="border-b border-neutral-50">
                  <td className="px-5 py-3">
                    <p className="font-mono font-medium text-navy">{c.code}</p>
                    {c.description && <p className="text-xs text-neutral-400">{c.description}</p>}
                  </td>
                  <td className="px-5 py-3">{c.discountType === "PERCENT" ? `${c.discountValue}%` : `₹${c.discountValue}`}</td>
                  <td className="px-5 py-3 text-neutral-500">{c.minOrderAmount ? `₹${c.minOrderAmount}` : "—"}</td>
                  <td className="px-5 py-3 text-neutral-500">
                    {c.usedCount}
                    {c.maxUses ? ` / ${c.maxUses}` : ""}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.active ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-500"}`}>
                      {c.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => toggleActive(c)} className="text-xs font-medium text-academic hover:underline">
                      {c.active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
              {coupons.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-neutral-400">
                    <Percent className="mx-auto mb-2 h-8 w-8 text-neutral-300" />
                    No coupons yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && (
        <Modal title="Add Coupon" onClose={() => setShowCreate(false)}>
          <div className="space-y-3">
            {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-600">Code</label>
              <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="e.g. BACKTOSCHOOL10" className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-academic" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-600">Description (optional)</label>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-academic" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-600">Type</label>
                <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value as "PERCENT" | "FLAT" })} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-academic">
                  <option value="PERCENT">Percent (%)</option>
                  <option value="FLAT">Flat (₹)</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-600">Value</label>
                <input type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-academic" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-600">Min Order (₹, optional)</label>
                <input type="number" value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-academic" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-600">Max Uses (optional)</label>
                <input type="number" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-academic" />
              </div>
            </div>
            <button
              onClick={submit}
              disabled={!form.code || !form.discountValue || saving}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy/90 disabled:bg-neutral-300"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Create Coupon
            </button>
          </div>
        </Modal>
      )}
    </AdminShell>
  );
}
