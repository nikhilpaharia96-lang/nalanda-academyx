"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { api } from "@/lib/api-client";
import { formatCurrency } from "@/lib/fees";
import { Plus, Package, Search } from "lucide-react";

interface Category {
  id: string;
  name: string;
}

interface ProductRow {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  salePrice: number | null;
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
  required: boolean;
  hasVariants: boolean;
  available: number | null;
  category: Category | null;
}

export default function AdminStoreProductsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Category[]>("/store/categories?includeInactive=true").then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: "1", pageSize: "50" });
    if (search) params.set("search", search);
    if (categoryId) params.set("categoryId", categoryId);
    if (status) params.set("status", status);
    api
      .get<{ items: ProductRow[]; total: number }>(`/store/products?${params.toString()}`)
      .then((r) => {
        setProducts(r.items);
        setTotal(r.total);
      })
      .finally(() => setLoading(false));
  }, [search, categoryId, status]);

  const toggleStatus = async (p: ProductRow) => {
    const next = p.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    await api.patch(`/store/products/${p.id}`, { status: next });
    setProducts((prev) => prev.map((row) => (row.id === p.id ? { ...row, status: next } : row)));
  };

  return (
    <AdminShell>
      <div className="ledger-bg flex items-center justify-between border-b border-neutral-200 bg-white px-8 py-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-academic">School Store</p>
          <h1 className="font-display text-2xl font-bold text-navy">Products</h1>
        </div>
        <Link href="/admin/store/products/new" className="flex items-center gap-1.5 rounded-md bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy/90">
          <Plus className="h-4 w-4" /> Add Product
        </Link>
      </div>

      <div className="p-8">
        <div className="mb-4 flex flex-wrap gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or SKU" className="rounded-md border border-neutral-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-academic" />
          </div>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-academic">
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-academic">
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>

        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-left text-xs uppercase text-neutral-500">
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3 text-right">Price</th>
                <th className="px-5 py-3 text-right">Stock</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-neutral-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-navy">
                      {p.name} {p.required && <span className="ml-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium uppercase text-amber-700">Required</span>}
                    </p>
                    {p.sku && <p className="text-xs text-neutral-400">SKU: {p.sku}</p>}
                  </td>
                  <td className="px-5 py-3 text-neutral-500">{p.category?.name ?? "—"}</td>
                  <td className="px-5 py-3 text-right">
                    <span className="font-medium text-navy">{formatCurrency(p.salePrice ?? p.price)}</span>
                    {p.salePrice && <span className="ml-1 text-xs text-neutral-400 line-through">{formatCurrency(p.price)}</span>}
                  </td>
                  <td className="px-5 py-3 text-right">{p.hasVariants ? "Variants" : (p.available ?? "—")}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : p.status === "ARCHIVED" ? "bg-neutral-100 text-neutral-500" : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => toggleStatus(p)} className="text-xs font-medium text-academic hover:underline">
                      {p.status === "ACTIVE" ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && products.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-neutral-400">
                    <Package className="mx-auto mb-2 h-8 w-8 text-neutral-300" />
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {total > 0 && <p className="mt-3 text-xs text-neutral-500">Showing {products.length} of {total} products</p>}
      </div>
    </AdminShell>
  );
}
