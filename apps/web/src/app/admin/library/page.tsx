"use client";

import { useCallback, useEffect, useState } from "react";
import { BookOpen, Plus, Search } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { Modal } from "@/components/modal";
import { api } from "@/lib/api-client";
import { Empty, ErrorBox, Field, PageHeader, Spinner, errMsg, ghostBtn, inputClass, primaryBtn } from "@/components/campus-ui";

interface Book { id: string; title: string; author: string | null; isbn: string | null; category: string | null; location: string | null; totalCopies: number; availableCopies: number; active: boolean }
interface Req { id: string; status: string; requestedAt: string; issuedAt: string | null; dueDate: string | null; returnedAt: string | null; bookTitle: string; studentName: string; studentId: string; bookId: string }
interface StudentRow { id: string; name: string; studentId: string }

const STATUS_STYLE: Record<string, string> = {
  REQUESTED: "bg-amber-50 text-amber-700", ISSUED: "bg-blue-50 text-blue-700", RETURNED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-700", CANCELLED: "bg-neutral-100 text-neutral-600",
};
const emptyBook = { title: "", author: "", isbn: "", category: "", location: "", totalCopies: 1 };

export default function AdminLibraryPage() {
  const [tab, setTab] = useState<"requests" | "books">("requests");
  const [books, setBooks] = useState<Book[]>([]);
  const [reqs, setReqs] = useState<Req[]>([]);
  const [status, setStatus] = useState("REQUESTED");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [bookModal, setBookModal] = useState<{ edit?: Book } | null>(null);
  const [bookForm, setBookForm] = useState(emptyBook);
  const [issueFor, setIssueFor] = useState<Req | null>(null);
  const [dueDate, setDueDate] = useState(() => new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10));
  const [lendModal, setLendModal] = useState(false);
  const [studentQ, setStudentQ] = useState("");
  const [studentHits, setStudentHits] = useState<StudentRow[]>([]);
  const [lend, setLend] = useState({ bookId: "", studentId: "" });
  const [modalError, setModalError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get<Book[]>(`/library/books${q ? `?q=${encodeURIComponent(q)}` : ""}`),
      api.get<Req[]>(`/library/requests${status ? `?status=${status}` : ""}`),
    ])
      .then(([b, r]) => { setBooks(b); setReqs(r); setError(null); })
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, [q, status]);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  useEffect(() => {
    if (studentQ.trim().length < 2) { setStudentHits([]); return; }
    const t = setTimeout(() => {
      api.get<{ data: StudentRow[] }>(`/students?search=${encodeURIComponent(studentQ)}&pageSize=8`).then((r) => setStudentHits(r.data)).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [studentQ]);

  async function act(fn: () => Promise<unknown>) {
    setSaving(true); setModalError(null); setError(null);
    try { await fn(); return true; } catch (e) { setModalError(errMsg(e)); setError(errMsg(e)); return false; } finally { setSaving(false); }
  }

  async function saveBook() {
    const payload = {
      title: bookForm.title.trim(), totalCopies: Number(bookForm.totalCopies) || 1,
      author: bookForm.author || undefined, isbn: bookForm.isbn || undefined, category: bookForm.category || undefined, location: bookForm.location || undefined,
    };
    const ok = await act(() => bookModal?.edit ? api.patch(`/library/books/${bookModal.edit.id}`, payload) : api.post("/library/books", payload));
    if (ok) { setBookModal(null); load(); }
  }

  return (
    <AdminShell>
      <PageHeader title="Library" icon={BookOpen}>
        <div className="flex gap-2">
          <button onClick={() => { setLend({ bookId: "", studentId: "" }); setStudentQ(""); setModalError(null); setLendModal(true); }} className={ghostBtn}>Issue to student</button>
          <button onClick={() => { setBookForm(emptyBook); setModalError(null); setBookModal({}); }} className={primaryBtn}><Plus className="h-4 w-4" /> Add Book</button>
        </div>
      </PageHeader>

      <div className="space-y-4 p-6 md:p-8">
        <div className="flex gap-2">
          {(["requests", "books"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`rounded-md px-4 py-1.5 text-sm font-medium ${tab === t ? "bg-navy text-white" : "bg-white text-navy ring-1 ring-neutral-300"}`}>{t === "requests" ? "Requests & Loans" : "Books"}</button>
          ))}
        </div>
        {error && <ErrorBox message={error} />}

        {tab === "books" && (
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
            <input className={`${inputClass} pl-9`} placeholder="Search title, author or ISBN" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        )}
        {tab === "requests" && (
          <select className={`${inputClass} sm:w-56`} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {["REQUESTED", "ISSUED", "RETURNED", "REJECTED", "CANCELLED"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        )}

        {loading ? <Spinner /> : tab === "books" ? (
          books.length === 0 ? <Empty text="No books yet. Add your first book." /> : (
            <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
              <table className="w-full min-w-[600px] text-sm">
                <thead><tr className="border-b bg-neutral-50 text-left text-xs uppercase text-neutral-500"><th className="px-3 py-2">Title</th><th className="px-3 py-2">Author</th><th className="px-3 py-2">Shelf</th><th className="px-3 py-2">Available</th><th /></tr></thead>
                <tbody>
                  {books.map((b) => (
                    <tr key={b.id} className="border-b border-neutral-100 last:border-0">
                      <td className="px-3 py-2 font-medium text-navy">{b.title}{!b.active && <span className="ml-2 text-xs text-neutral-400">(inactive)</span>}</td>
                      <td className="px-3 py-2 text-neutral-600">{b.author || "—"}</td>
                      <td className="px-3 py-2 text-neutral-600">{b.location || "—"}</td>
                      <td className="px-3 py-2"><span className={b.availableCopies === 0 ? "text-red-600" : "text-emerald-700"}>{b.availableCopies}</span> / {b.totalCopies}</td>
                      <td className="px-3 py-2 text-right"><button className={ghostBtn} onClick={() => { setBookForm({ title: b.title, author: b.author || "", isbn: b.isbn || "", category: b.category || "", location: b.location || "", totalCopies: b.totalCopies }); setModalError(null); setBookModal({ edit: b }); }}>Edit</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : reqs.length === 0 ? <Empty text="No requests for this filter." /> : (
          <div className="space-y-2">
            {reqs.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-navy">{r.bookTitle}</p>
                  <p className="text-xs text-neutral-500">{r.studentName} · requested {r.requestedAt.slice(0, 10)}{r.dueDate ? ` · due ${r.dueDate}` : ""}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[r.status] || ""}`}>{r.status}</span>
                  {r.status === "REQUESTED" && (<>
                    <button className={ghostBtn} disabled={saving} onClick={() => { setModalError(null); setIssueFor(r); }}>Issue</button>
                    <button className={ghostBtn} disabled={saving} onClick={async () => { if (await act(() => api.post(`/library/requests/${r.id}/reject`, {}))) load(); }}>Reject</button>
                  </>)}
                  {r.status === "ISSUED" && <button className={ghostBtn} disabled={saving} onClick={async () => { if (await act(() => api.post(`/library/requests/${r.id}/return`))) load(); }}>Mark returned</button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {bookModal && (
        <Modal title={bookModal.edit ? "Edit book" : "Add book"} onClose={() => setBookModal(null)}>
          <div className="space-y-3">
            <Field label="Title"><input className={inputClass} value={bookForm.title} onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Author"><input className={inputClass} value={bookForm.author} onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })} /></Field>
              <Field label="ISBN"><input className={inputClass} value={bookForm.isbn} onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })} /></Field>
              <Field label="Category"><input className={inputClass} value={bookForm.category} onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })} /></Field>
              <Field label="Shelf / location"><input className={inputClass} value={bookForm.location} onChange={(e) => setBookForm({ ...bookForm, location: e.target.value })} /></Field>
            </div>
            <Field label="Total copies"><input type="number" min={1} className={inputClass} value={bookForm.totalCopies} onChange={(e) => setBookForm({ ...bookForm, totalCopies: Number(e.target.value) })} /></Field>
            {modalError && <ErrorBox message={modalError} />}
            <button className={`${primaryBtn} w-full`} disabled={saving || !bookForm.title.trim()} onClick={saveBook}>Save</button>
          </div>
        </Modal>
      )}

      {issueFor && (
        <Modal title={`Issue “${issueFor.bookTitle}”`} onClose={() => setIssueFor(null)}>
          <div className="space-y-3">
            <p className="text-sm text-neutral-600">To {issueFor.studentName}</p>
            <Field label="Due date"><input type="date" className={inputClass} value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></Field>
            {modalError && <ErrorBox message={modalError} />}
            <button className={`${primaryBtn} w-full`} disabled={saving} onClick={async () => { if (await act(() => api.post(`/library/requests/${issueFor.id}/issue`, { dueDate }))) { setIssueFor(null); load(); } }}>Confirm issue</button>
          </div>
        </Modal>
      )}

      {lendModal && (
        <Modal title="Issue book to student" onClose={() => setLendModal(false)}>
          <div className="space-y-3">
            <Field label="Student (type name or ID)">
              <input className={inputClass} value={studentQ} onChange={(e) => { setStudentQ(e.target.value); setLend({ ...lend, studentId: "" }); }} />
            </Field>
            {studentHits.length > 0 && !lend.studentId && (
              <div className="rounded-md border border-neutral-200">
                {studentHits.map((s) => <button key={s.id} className="block w-full px-3 py-2 text-left text-sm hover:bg-neutral-50" onClick={() => { setLend({ ...lend, studentId: s.id }); setStudentQ(`${s.name} (${s.studentId})`); setStudentHits([]); }}>{s.name} <span className="text-neutral-400">{s.studentId}</span></button>)}
              </div>
            )}
            <Field label="Book">
              <select className={inputClass} value={lend.bookId} onChange={(e) => setLend({ ...lend, bookId: e.target.value })}>
                <option value="">Select book</option>
                {books.filter((b) => b.active && b.availableCopies > 0).map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
              </select>
            </Field>
            <Field label="Due date"><input type="date" className={inputClass} value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></Field>
            {modalError && <ErrorBox message={modalError} />}
            <button className={`${primaryBtn} w-full`} disabled={saving || !lend.bookId || !lend.studentId} onClick={async () => {
              if (await act(async () => { const r = await api.post<{ id: string }>("/library/requests", lend); await api.post(`/library/requests/${r.id}/issue`, { dueDate }); })) { setLendModal(false); load(); }
            }}>Issue</button>
          </div>
        </Modal>
      )}
    </AdminShell>
  );
}
