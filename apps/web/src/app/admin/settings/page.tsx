"use client";

import { useEffect, useState } from "react";
import { Check, Settings as SettingsIcon } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { api } from "@/lib/api-client";
import { ErrorBox, Field, PageHeader, Spinner, errMsg, inputClass, primaryBtn } from "@/components/campus-ui";

// The keys the rest of the app actually reads (receipts, public school info).
const FIELDS = [
  { key: "school_name", label: "School name", placeholder: "Nalanda Academy" },
  { key: "school_address", label: "Address", placeholder: "Street, city, state, PIN" },
  { key: "school_phone", label: "Phone", placeholder: "+91 …" },
  { key: "school_email", label: "Email", placeholder: "office@school.in" },
  { key: "school_logo_url", label: "Logo URL (https://…)", placeholder: "https://…" },
] as const;

export default function AdminSettingsPage() {
  const [saved, setSaved] = useState<Record<string, string> | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    api.get<{ key: string; value: string }[]>("/settings")
      .then((rows) => {
        const m = Object.fromEntries(rows.map((r) => [r.key, r.value]));
        setSaved(m);
        setValues(Object.fromEntries(FIELDS.map((f) => [f.key, m[f.key] ?? ""])));
      })
      .catch((e) => setError(errMsg(e)));
  }, []);

  const changed = FIELDS.filter((f) => saved && (values[f.key] ?? "") !== (saved[f.key] ?? ""));

  async function save() {
    setSaving(true); setError(null); setDone(false);
    try {
      for (const f of changed) await api.put(`/settings/${f.key}`, { value: values[f.key].trim() });
      setSaved({ ...saved!, ...Object.fromEntries(changed.map((f) => [f.key, values[f.key].trim()])) });
      setDone(true);
    } catch (e) { setError(errMsg(e)); } finally { setSaving(false); }
  }

  return (
    <AdminShell>
      <PageHeader title="Settings" icon={SettingsIcon} />
      <div className="max-w-xl space-y-4 p-6 md:p-8">
        <p className="text-sm text-neutral-600">School details shown on fee receipts and marksheets.</p>
        {error && <ErrorBox message={error} />}
        {!saved && !error ? <Spinner /> : saved && (
          <div className="space-y-3 rounded-lg border border-neutral-200 bg-white p-5">
            {FIELDS.map((f) => (
              <Field key={f.key} label={f.label}><input className={inputClass} placeholder={f.placeholder} value={values[f.key] ?? ""} onChange={(e) => { setValues({ ...values, [f.key]: e.target.value }); setDone(false); }} /></Field>
            ))}
            <div className="flex items-center gap-3">
              <button className={primaryBtn} disabled={!changed.length || saving} onClick={save}>{saving ? "Saving…" : "Save settings"}</button>
              {done && <span className="inline-flex items-center gap-1 text-sm text-emerald-700"><Check className="h-4 w-4" /> Saved</span>}
            </div>
          </div>
        )}
        <p className="text-xs text-neutral-500">Store options are under School Store → Store Settings.</p>
      </div>
    </AdminShell>
  );
}
