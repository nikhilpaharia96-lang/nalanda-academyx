"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { Modal } from "@/components/modal";
import { api, ApiError } from "@/lib/api-client";
import { Plus, Loader2, Tag } from "lucide-react";

interface Category {
  id: string;
  name: string;
  icon: string | null;
  displayOrder: number;
  active: boolean;
}

const emptyForm = { name: "", icon: "", displayOrder: 0 };

export default function AdminStoreCategoriesPage() {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => api.get<Category[]>("/store/categories?includeInactive=true").then(setCategories).catch(() => setCategories([]));

  useEffect(() => {
    load();
  }, []);

  const submitCreate = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.post("/store/categories", { name: form.name, icon: form.icon || undefined, displayOrder: form.displayOrder });
      setShowCreate(false);
      setForm(emptyForm);
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not create category");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (cat: Category) => {
    await api.patch(`/store/categories/${cat.id}`, { active: !cat.active });
    load();
  };

  return (
    <AdminShell>
      <div className="ledger-bg flex items-center justify-between border-b border-neutral-200 bg-white px-8 py-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-academic">School Store</p>
          <h1 className="font-display text-2xl font-bold text-navy">Categories</h1>
        </div>
        <button
          onClick={() => {
            setForm(emptyForm);
            setError(null);
            setShowCreate(true);
          }}
          className="flex items-center gap-1.5 rounded-md bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy/90"
        >
          <Plus className="h-4 w-4" /> Add Category
        </button>
      </div>

      <div className="p-8">
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-left text-xs uppercase text-neutral-500">
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Display Order</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {categories?.map((c) => (
                <tr key={c.id} className="border-b border-neutral-50">
                  <td className="px-5 py-3">
                    <span className="mr-2">{c.icon ?? <Tag className="inline h-4 w-4 text-neutral-300" />}</span>
                    <span className="font-medium text-navy">{c.name}</span>
                  </td>
                  <td className="px-5 py-3 text-neutral-500">{c.displayOrder}</td>
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
              {categories?.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-neutral-400">
                    No categories yet — add your first one (Books, Uniform, Stationery, etc).
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && (
        <Modal title="Add Category" onClose={() => setShowCreate(false)}>
          <div className="space-y-3">
            {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-600">Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Books, Uniform, Stationery" className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-academic" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-600">Icon (emoji, optional)</label>
              <input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="📚" className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-academic" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-600">Display Order</label>
              <input type="number" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-academic" />
            </div>
            <button
              onClick={submitCreate}
              disabled={!form.name || saving}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy/90 disabled:bg-neutral-300"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Create Category
            </button>
          </div>
        </Modal>
      )}
    </AdminShell>
  );
}
