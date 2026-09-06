"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { api, ApiError } from "@/lib/api-client";
import { Plus, Trash2, Loader2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
}
interface SchoolClass {
  id: string;
  name: string;
}
interface VariantDraft {
  label: string;
  sku: string;
  priceOverride: string;
  stockQuantity: string;
}

export default function AdminAddProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [required, setRequired] = useState(false);
  const [classIds, setClassIds] = useState<string[]>([]);
  const [applyToAllClasses, setApplyToAllClasses] = useState(true);
  const [stockQuantity, setStockQuantity] = useState("0");
  const [lowStockThreshold, setLowStockThreshold] = useState("5");
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState<VariantDraft[]>([{ label: "", sku: "", priceOverride: "", stockQuantity: "0" }]);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<Category[]>("/store/categories").then(setCategories).catch(() => {});
    api.get<SchoolClass[]>("/classes").then(setClasses).catch(() => {});
  }, []);

  const toggleClass = (id: string) => {
    setClassIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  const addVariantRow = () => setVariants((prev) => [...prev, { label: "", sku: "", priceOverride: "", stockQuantity: "0" }]);
  const removeVariantRow = (idx: number) => setVariants((prev) => prev.filter((_, i) => i !== idx));
  const updateVariantRow = (idx: number, field: keyof VariantDraft, value: string) =>
    setVariants((prev) => prev.map((v, i) => (i === idx ? { ...v, [field]: value } : v)));

  const submit = async () => {
    setError(null);
    if (!name || !categoryId || !price) {
      setError("Please fill in product name, category, and price.");
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name,
        categoryId,
        sku: sku || undefined,
        description: description || undefined,
        price: Number(price),
        salePrice: salePrice ? Number(salePrice) : undefined,
        imageUrl: imageUrl || undefined,
        required,
        classIds: applyToAllClasses ? [] : classIds,
        lowStockThreshold: Number(lowStockThreshold),
      };
      if (hasVariants) {
        payload.variants = variants
          .filter((v) => v.label)
          .map((v) => ({
            label: v.label,
            sku: v.sku || undefined,
            priceOverride: v.priceOverride ? Number(v.priceOverride) : undefined,
            stockQuantity: Number(v.stockQuantity || 0),
          }));
      } else {
        payload.stockQuantity = Number(stockQuantity);
      }

      await api.post("/store/products", payload);
      router.push("/admin/store/products");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not create product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell>
      <div className="ledger-bg border-b border-neutral-200 bg-white px-8 py-6">
        <p className="font-mono text-xs uppercase tracking-widest text-academic">School Store</p>
        <h1 className="font-display text-2xl font-bold text-navy">Add Product</h1>
      </div>

      <div className="mx-auto max-w-3xl space-y-6 p-8">
        {error && <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 font-display text-sm font-bold text-navy">Basic Details</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-neutral-600">Product Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Class 3 Mathematics Book" className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-academic" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-600">Category</label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-academic">
                <option value="">Select category…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-600">SKU / Product Code (optional)</label>
              <input value={sku} onChange={(e) => setSku(e.target.value)} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-academic" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-neutral-600">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-academic" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-600">Price (₹)</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-academic" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-600">Sale Price (₹, optional)</label>
              <input type="number" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-academic" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-neutral-600">Image URL (optional)</label>
              <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-academic" />
            </div>
            <label className="flex items-center gap-2 text-sm text-neutral-700">
              <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} />
              Required item (shown under &ldquo;Required for your class&rdquo;)
            </label>
          </div>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 font-display text-sm font-bold text-navy">Class-wise Availability</h2>
          <label className="mb-3 flex items-center gap-2 text-sm text-neutral-700">
            <input type="checkbox" checked={applyToAllClasses} onChange={(e) => setApplyToAllClasses(e.target.checked)} />
            Available to all classes (uniforms, stationery, etc.)
          </label>
          {!applyToAllClasses && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {classes.map((c) => (
                <label key={c.id} className="flex items-center gap-2 rounded-md border border-neutral-200 px-3 py-2 text-sm">
                  <input type="checkbox" checked={classIds.includes(c.id)} onChange={() => toggleClass(c.id)} />
                  {c.name}
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-sm font-bold text-navy">Stock & Variants</h2>
            <label className="flex items-center gap-2 text-sm text-neutral-700">
              <input type="checkbox" checked={hasVariants} onChange={(e) => setHasVariants(e.target.checked)} />
              This product has variants (size/color)
            </label>
          </div>

          {!hasVariants ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-600">Stock Quantity</label>
                <input type="number" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-academic" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-600">Low Stock Threshold</label>
                <input type="number" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(e.target.value)} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-academic" />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {variants.map((v, idx) => (
                <div key={idx} className="grid grid-cols-1 gap-2 rounded-md border border-neutral-200 p-3 sm:grid-cols-5 sm:items-end">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-neutral-600">Variant (e.g. Size 32)</label>
                    <input value={v.label} onChange={(e) => updateVariantRow(idx, "label", e.target.value)} className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm outline-none focus:border-academic" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-neutral-600">SKU</label>
                    <input value={v.sku} onChange={(e) => updateVariantRow(idx, "sku", e.target.value)} className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm outline-none focus:border-academic" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-neutral-600">Price Override</label>
                    <input type="number" value={v.priceOverride} onChange={(e) => updateVariantRow(idx, "priceOverride", e.target.value)} className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm outline-none focus:border-academic" />
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className="mb-1 block text-xs font-medium text-neutral-600">Stock</label>
                      <input type="number" value={v.stockQuantity} onChange={(e) => updateVariantRow(idx, "stockQuantity", e.target.value)} className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm outline-none focus:border-academic" />
                    </div>
                    <button onClick={() => removeVariantRow(idx)} className="rounded-md p-2 text-neutral-400 hover:bg-red-50 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              <button onClick={addVariantRow} className="flex items-center gap-1.5 text-sm font-medium text-academic hover:underline">
                <Plus className="h-4 w-4" /> Add another variant
              </button>
            </div>
          )}
        </div>

        <button
          onClick={submit}
          disabled={saving}
          className="flex items-center gap-2 rounded-md bg-navy px-6 py-2.5 text-sm font-semibold text-white hover:bg-navy/90 disabled:bg-neutral-300"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Create Product
        </button>
      </div>
    </AdminShell>
  );
}
