"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { Modal } from "@/components/modal";
import { api, ApiError } from "@/lib/api-client";
import { Loader2, Boxes } from "lucide-react";

interface InventoryRow {
  productId: string;
  variantId: string | null;
  productName: string;
  variantLabel: string | null;
  sku: string | null;
  stockQuantity: number;
  reservedQuantity: number;
  available: number;
  lowStockThreshold: number;
  lowStock: boolean;
}

export default function AdminStoreInventoryPage() {
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [adjusting, setAdjusting] = useState<InventoryRow | null>(null);
  const [delta, setDelta] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .get<InventoryRow[]>("/store/inventory")
      .then(setRows)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const submitAdjust = async () => {
    if (!adjusting || !delta) return;
    setSaving(true);
    setError(null);
    try {
      await api.post("/store/inventory/adjust", {
        productId: adjusting.productId,
        variantId: adjusting.variantId ?? undefined,
        quantityChange: Number(delta),
        note: note || undefined,
      });
      setAdjusting(null);
      setDelta("");
      setNote("");
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not adjust stock");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell>
      <div className="ledger-bg border-b border-neutral-200 bg-white px-8 py-6">
        <p className="font-mono text-xs uppercase tracking-widest text-academic">School Store</p>
        <h1 className="font-display text-2xl font-bold text-navy">Inventory</h1>
      </div>

      <div className="p-8">
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-left text-xs uppercase text-neutral-500">
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Variant</th>
                <th className="px-5 py-3">SKU</th>
                <th className="px-5 py-3 text-right">Stock</th>
                <th className="px-5 py-3 text-right">Reserved</th>
                <th className="px-5 py-3 text-right">Available</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={`${r.productId}-${r.variantId ?? "base"}`} className="border-b border-neutral-50">
                  <td className="px-5 py-3 font-medium text-navy">{r.productName}</td>
                  <td className="px-5 py-3 text-neutral-500">{r.variantLabel ?? "—"}</td>
                  <td className="px-5 py-3 text-neutral-400">{r.sku ?? "—"}</td>
                  <td className="px-5 py-3 text-right">{r.stockQuantity}</td>
                  <td className="px-5 py-3 text-right text-neutral-500">{r.reservedQuantity}</td>
                  <td className={`px-5 py-3 text-right font-medium ${r.lowStock ? "text-red-600" : "text-navy"}`}>
                    {r.available} {r.lowStock && <span className="ml-1 rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-medium uppercase">Low</span>}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => setAdjusting(r)} className="text-xs font-medium text-academic hover:underline">
                      Adjust Stock
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-neutral-400">
                    <Boxes className="mx-auto mb-2 h-8 w-8 text-neutral-300" />
                    No products yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {adjusting && (
        <Modal title={`Adjust Stock — ${adjusting.productName}${adjusting.variantLabel ? ` (${adjusting.variantLabel})` : ""}`} onClose={() => setAdjusting(null)}>
          <div className="space-y-3">
            {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <p className="text-xs text-neutral-500">Current stock: {adjusting.stockQuantity} • Available: {adjusting.available}</p>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-600">Quantity change (use negative to remove/write-off)</label>
              <input type="number" value={delta} onChange={(e) => setDelta(e.target.value)} placeholder="e.g. 50 or -5" className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-academic" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-600">Note (optional)</label>
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. New stock arrived" className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-academic" />
            </div>
            <button
              onClick={submitAdjust}
              disabled={!delta || saving}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy/90 disabled:bg-neutral-300"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save Adjustment
            </button>
          </div>
        </Modal>
      )}
    </AdminShell>
  );
}
