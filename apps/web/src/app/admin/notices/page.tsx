"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { api, ApiError } from "@/lib/api-client";
import { Megaphone, Pencil, Plus, Loader2, AlertTriangle, RefreshCw, Trash2, Eye, EyeOff, Search, Paperclip, Link2 } from "lucide-react";

interface NoticeRow {
  id: string;
  title: string;
  slug: string;
  category: string;
  important: boolean;
  published: boolean;
  noticeDate: string | null;
  attachmentUrl: string | null;
  externalLink: string | null;
  displayOrder: number;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso.length <= 10 ? iso + "T00:00:00" : iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState<NoticeRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "PUBLISHED" | "DRAFT">("");
  const [busyId, setBusyId] = useState<string | null>(null);

  // Admins are authenticated, so the shared public list endpoint already
  // returns both published and unpublished notices (see notices.controller.ts
  // / isAdmin()) — no separate admin-only list endpoint needed.
  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .get<NoticeRow[]>("/notices")
      .then(setNotices)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load notices"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = (notices || []).filter((n) => {
    if (statusFilter === "PUBLISHED" && !n.published) return false;
    if (statusFilter === "DRAFT" && n.published) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return n.title.toLowerCase().includes(q) || n.category.toLowerCase().includes(q);
  });

  async function togglePublish(row: NoticeRow) {
    setBusyId(row.id);
    try {
      await api.patch(`/notices/${row.id}/publish`, { published: !row.published });
      setNotices((prev) => prev?.map((n) => (n.id === row.id ? { ...n, published: !row.published } : n)) || null);
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Failed to update notice status");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(row: NoticeRow) {
    if (!confirm(`Delete "${row.title}"? This cannot be undone.`)) return;
    setBusyId(row.id);
    try {
      await api.del(`/notices/${row.id}`);
      setNotices((prev) => prev?.filter((n) => n.id !== row.id) || null);
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Failed to delete notice");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminShell>
      <div className="ledger-bg border-b border-neutral-200 bg-white px-6 py-6 md:px-8">
        <p className="font-mono text-xs uppercase tracking-widest text-academic">Content Management</p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-academic" />
            <h1 className="font-display text-2xl font-bold text-navy">Latest Notices</h1>
          </div>
          <Link
            href="/admin/notices/new"
            className="inline-flex items-center gap-1.5 rounded-md bg-academic px-4 py-2 text-sm font-medium text-white transition hover:bg-academic-light"
          >
            <Plus className="h-4 w-4" />
            Add Notice
          </Link>
        </div>
        <p className="mt-1 text-sm text-neutral-500">
          Controls the &ldquo;Latest Notices&rdquo; section on the public website. Only published notices, newest first, appear there.
        </p>
      </div>

      <div className="p-6 md:p-8">
        <div className="mb-4 flex flex-wrap gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or category…"
              className="w-72 max-w-full rounded-md border border-neutral-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-academic focus:ring-1 focus:ring-academic"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-academic"
          >
            <option value="">All Statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
          </select>
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-neutral-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading notices…
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-red-200 bg-red-50 py-10 text-center">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <p className="text-sm text-red-600">{error}</p>
            <button onClick={load} className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 underline">
              <RefreshCw className="h-3 w-3" />
              Retry
            </button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-neutral-200 bg-white py-16 text-center text-neutral-400">
            <Megaphone className="h-8 w-8" />
            <p className="text-sm text-neutral-500">{search || statusFilter ? "No notices match your filters." : "No notices added yet."}</p>
            {!search && !statusFilter && (
              <Link href="/admin/notices/new" className="text-sm font-medium text-academic hover:underline">
                Add your first notice
              </Link>
            )}
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white shadow-sm">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-neutral-100 text-xs uppercase tracking-wide text-neutral-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Notice</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Links</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map((row) => (
                  <tr key={row.id}>
                    <td className="px-5 py-3 font-medium text-navy">
                      {row.title}
                      {row.important && <span className="ml-1.5 rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-medium uppercase text-red-700">Important</span>}
                    </td>
                    <td className="px-5 py-3 text-neutral-600">{row.category}</td>
                    <td className="px-5 py-3 text-neutral-600">{formatDate(row.noticeDate)}</td>
                    <td className="px-5 py-3 text-neutral-400">
                      <div className="flex items-center gap-2">
                        {row.attachmentUrl && (
                          <span title="Has attachment">
                            <Paperclip className="h-3.5 w-3.5" />
                          </span>
                        )}
                        {row.externalLink && (
                          <span title="Has external link">
                            <Link2 className="h-3.5 w-3.5" />
                          </span>
                        )}
                        {!row.attachmentUrl && !row.externalLink && "—"}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${row.published ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                        {row.published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/notices/${row.id}`}
                          title="Edit"
                          className="inline-flex items-center gap-1 rounded-md border border-neutral-200 px-2 py-1 text-xs text-neutral-600 transition hover:bg-neutral-50"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Link>
                        <button
                          onClick={() => togglePublish(row)}
                          disabled={busyId === row.id}
                          title={row.published ? "Unpublish" : "Publish"}
                          className="inline-flex items-center gap-1 rounded-md border border-neutral-200 px-2 py-1 text-xs text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-50"
                        >
                          {row.published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          {row.published ? "Unpublish" : "Publish"}
                        </button>
                        <button
                          onClick={() => handleDelete(row)}
                          disabled={busyId === row.id}
                          title="Delete"
                          className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
