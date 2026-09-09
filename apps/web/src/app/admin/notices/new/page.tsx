"use client";

import { AdminShell } from "@/components/admin-shell";
import { NoticeForm } from "../_components/NoticeForm";

export default function AdminAddNoticePage() {
  return (
    <AdminShell>
      <div className="ledger-bg border-b border-neutral-200 bg-white px-6 py-6 md:px-8">
        <p className="font-mono text-xs uppercase tracking-widest text-academic">Content Management</p>
        <h1 className="font-display text-2xl font-bold text-navy">Add Notice</h1>
      </div>
      <NoticeForm />
    </AdminShell>
  );
}
