"use client";

import { useCallback, useEffect, useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import { api } from "@/lib/api-client";
import { STUDENT_NAV } from "@/lib/student-nav";
import { Empty, ErrorBox, Spinner, errMsg, ghostBtn, inputClass } from "@/components/campus-ui";

interface Book { id: string; title: string; author: string | null; location: string | null; availableCopies: number }
interface Req { id: string; status: string; bookTitle: string; dueDate: string | null; requestedAt: string }

export default function StudentLibraryPage() {
  const [books, setBooks] = useState<Book[] | null>(null);
  const [reqs, setReqs] = useState<Req[]>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    Promise.all([api.get<Book[]>(`/library/books${q ? `?q=${encodeURIComponent(q)}` : ""}`), api.get<Req[]>("/library/requests")])
      .then(([b, r]) => { setBooks(b); setReqs(r); })
      .catch((e) => setError(errMsg(e)));
  }, [q]);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  async function act(id: string, fn: () => Promise<unknown>) {
    setBusy(id); setError(null);
    try { await fn(); load(); } catch (e) { setError(errMsg(e)); } finally { setBusy(null); }
  }
  const open = (bookTitle: string) => reqs.find((r) => r.bookTitle === bookTitle && (r.status === "REQUESTED" || r.status === "ISSUED"));

  return (
    <PortalShell navItems={STUDENT_NAV} loginPath="/student/login" allowedRoles={["STUDENT"]} portalLabel="Student Portal">
      <div className="ledger-bg border-b border-neutral-200 bg-white px-6 py-6 sm:px-8">
        <p className="font-mono text-xs uppercase tracking-widest text-academic">Student Portal</p>
        <h1 className="font-display text-2xl font-bold text-navy">Library</h1>
      </div>
      <div className="space-y-6 p-6 sm:p-8">
        {error && <ErrorBox message={error} />}

        <section>
          <h2 className="mb-2 text-sm font-semibold text-navy">My books</h2>
          {reqs.length === 0 ? <Empty text="You haven't requested any books yet." /> : (
            <div className="space-y-2">
              {reqs.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-navy">{r.bookTitle}</p>
                    <p className="text-xs text-neutral-500">{r.status}{r.dueDate && r.status === "ISSUED" ? ` · due ${r.dueDate}` : ""}</p>
                  </div>
                  {r.status === "REQUESTED" && <button className={ghostBtn} disabled={busy === r.id} onClick={() => act(r.id, () => api.post(`/library/requests/${r.id}/cancel`))}>Cancel</button>}
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold text-navy">Browse books</h2>
          <input className={`${inputClass} mb-3`} placeholder="Search title, author or ISBN" value={q} onChange={(e) => setQ(e.target.value)} />
          {!books ? <Spinner /> : books.length === 0 ? <Empty text="No books found." /> : (
            <div className="space-y-2">
              {books.map((b) => {
                const existing = open(b.title);
                return (
                  <div key={b.id} className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-navy">{b.title}</p>
                      <p className="text-xs text-neutral-500">{b.author || "Unknown author"}{b.location ? ` · Shelf ${b.location}` : ""} · {b.availableCopies > 0 ? `${b.availableCopies} available` : "Not available"}</p>
                    </div>
                    {existing ? <span className="text-xs text-neutral-500">{existing.status}</span> : (
                      <button className={ghostBtn} disabled={busy === b.id} onClick={() => act(b.id, () => api.post("/library/requests", { bookId: b.id }))}>Request</button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </PortalShell>
  );
}
