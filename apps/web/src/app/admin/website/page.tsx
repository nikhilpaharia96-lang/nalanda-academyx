"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Globe, RotateCcw } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { api, ApiError } from "@/lib/api-client";
import { ErrorBox, PageHeader, Spinner, errMsg, ghostBtn, primaryBtn } from "@/components/campus-ui";
import { HomepageEditor, Node } from "@/components/site-content-editor";

interface Section { key: string; label: string; description: string; value: any; defaults: any; customized: boolean }

function collectIcons(v: any, out = new Set<string>()): string[] {
  if (Array.isArray(v)) v.forEach((x) => collectIcons(x, out));
  else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) { if (k === "icon" && typeof x === "string" && x) out.add(x); else collectIcons(x, out); }
  return [...out].sort();
}

export default function AdminWebsitePage() {
  const [sections, setSections] = useState<Section[] | null>(null);
  const [activeKey, setActiveKey] = useState<string>("hero");
  const [draft, setDraft] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<{ path: string; message: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ sections: Section[] }>("/site-content/admin")
      .then((r) => { setSections(r.sections); const first = r.sections.find((s) => s.key === "hero") ?? r.sections[0]; setActiveKey(first.key); setDraft(first.value); })
      .catch((e) => setError(errMsg(e)));
  }, []);

  const active = sections?.find((s) => s.key === activeKey);
  const dirty = !!active && JSON.stringify(draft) !== JSON.stringify(active.value);
  const icons = useMemo(() => (sections ? collectIcons(sections.map((s) => s.defaults)) : []), [sections]);

  function pick(key: string) {
    if (dirty && !confirm("You have unsaved changes in this section. Discard them?")) return;
    const s = sections!.find((x) => x.key === key)!;
    setActiveKey(key); setDraft(s.value); setError(null); setIssues([]); setDone(null);
  }

  function update(key: string, value: any, customized: boolean) {
    setSections((prev) => prev!.map((s) => (s.key === key ? { ...s, value, customized } : s)));
    setDraft(value);
  }

  async function save() {
    setBusy(true); setError(null); setIssues([]); setDone(null);
    try {
      const r = await api.put<{ value: any }>(`/site-content/${activeKey}`, { value: draft });
      update(activeKey, r.value, true);
      setDone("Saved. The public website updates within about 30 seconds.");
    } catch (e) {
      setError(errMsg(e));
      if (e instanceof ApiError && e.issues) setIssues(e.issues);
    } finally { setBusy(false); }
  }

  async function reset() {
    if (!confirm(`Reset "${active!.label}" to the original text? Your edits in this section will be lost.`)) return;
    setBusy(true); setError(null); setIssues([]); setDone(null);
    try {
      const r = await api.del<{ value: any }>(`/site-content/${activeKey}`);
      update(activeKey, r.value, false);
      setDone("Reset to the original content.");
    } catch (e) { setError(errMsg(e)); } finally { setBusy(false); }
  }

  return (
    <AdminShell>
      <PageHeader title="Website Content" icon={Globe} />
      <div className="space-y-4 p-6 md:p-8">
        <p className="max-w-2xl text-sm text-neutral-600">
          Edit everything visitors see on the public website — text, images, menus, colours and homepage layout. Pick a section, make your changes and press Save.
          Events, notices, faculty and results are still managed from their own admin pages.
        </p>
        {error && !sections && <ErrorBox message={error} />}
        {!sections && !error ? <Spinner /> : sections && active && (
          <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
            <nav className="flex flex-wrap gap-2 lg:flex-col lg:flex-nowrap lg:gap-1">
              {sections.map((s) => (
                <button key={s.key} type="button" onClick={() => pick(s.key)}
                  className={`rounded-md px-3 py-2 text-left text-sm ${s.key === activeKey ? "bg-neutral-900 font-medium text-white" : "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100"}`}>
                  {s.label}{s.customized && <span className={`ml-2 text-[10px] uppercase ${s.key === activeKey ? "text-emerald-300" : "text-emerald-700"}`}>edited</span>}
                </button>
              ))}
            </nav>

            <section className="min-w-0 rounded-lg border border-neutral-200 bg-white p-5">
              <h2 className="text-lg font-semibold">{active.label}</h2>
              <p className="mb-4 text-sm text-neutral-600">{active.description}</p>
              <datalist id="site-icons">{icons.map((i) => <option key={i} value={i} />)}</datalist>
              {draft && (active.key === "homepage"
                ? <HomepageEditor value={draft} onChange={setDraft} />
                : <Node def={active.defaults} value={draft} onChange={setDraft} name={active.key} icons={icons} colour={active.key === "theme"} />)}

              {error && sections && <div className="mt-4"><ErrorBox message={error} /></div>}
              {issues.length > 0 && (
                <ul className="mt-2 list-disc pl-5 text-xs text-red-700">{issues.map((i, k) => <li key={k}><code>{i.path}</code>: {i.message}</li>)}</ul>
              )}
              <div className="sticky bottom-0 -mx-5 mt-5 flex flex-wrap items-center gap-3 border-t border-neutral-200 bg-white px-5 py-3">
                <button className={primaryBtn} disabled={!dirty || busy} onClick={save}>{busy ? "Working…" : "Save changes"}</button>
                <button className={ghostBtn} disabled={!dirty || busy} onClick={() => { setDraft(active.value); setIssues([]); setError(null); }}>Discard</button>
                <button className={ghostBtn} disabled={!active.customized || busy} onClick={reset}><RotateCcw className="mr-1 inline h-4 w-4" />Reset to original</button>
                {done && <span className="inline-flex items-center gap-1 text-sm text-emerald-700"><Check className="h-4 w-4" /> {done}</span>}
              </div>
            </section>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
