"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { Modal } from "@/components/fees/Modal";
import { api, ApiError } from "@/lib/api-client";
import { Loader2, ClipboardList, CheckCircle2, Copy, Check } from "lucide-react";

interface Application {
  id: string;
  applicationNumber: string;
  studentName: string;
  dateOfBirth: string;
  gender: string;
  classId: string;
  previousSchool: string | null;
  parentName: string;
  parentPhone: string;
  parentEmail: string | null;
  address: string | null;
  message: string | null;
  status: string;
  paymentStatus: string;
  createdAt: string;
}
interface Ref {
  id: string;
  name: string;
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-neutral-100 text-neutral-600",
  SUBMITTED: "bg-blue-50 text-blue-700",
  UNDER_REVIEW: "bg-amber-50 text-amber-700",
  APPROVED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-700",
  PAYMENT_PENDING: "bg-amber-50 text-amber-700",
  PAYMENT_COMPLETED: "bg-blue-50 text-blue-700",
  ENROLLED: "bg-purple-50 text-purple-700",
};
function humanize(s: string) {
  return s
    .split("_")
    .map((w) => w[0] + w.slice(1).toLowerCase())
    .join(" ");
}
function StatusBadge({ status }: { status: string }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status] ?? "bg-neutral-100 text-neutral-600"}`}>{humanize(status)}</span>;
}

// Mirrors AdmissionsService's VALID_TRANSITIONS on the backend — used only
// to decide which action buttons to show. The backend re-validates every
// transition regardless, so this is a UI convenience, not the source of truth.
const NEXT_STATUSES: Record<string, string[]> = {
  DRAFT: ["SUBMITTED"],
  SUBMITTED: ["UNDER_REVIEW", "REJECTED"],
  UNDER_REVIEW: ["APPROVED", "REJECTED"],
  APPROVED: ["PAYMENT_PENDING"],
  PAYMENT_PENDING: ["PAYMENT_COMPLETED"],
  PAYMENT_COMPLETED: ["ENROLLED"],
  REJECTED: [],
  ENROLLED: [],
};

function DetailModal({
  application,
  classById,
  onClose,
  onChanged,
}: {
  application: Application;
  classById: Map<string, string>;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [busyStatus, setBusyStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enrollResult, setEnrollResult] = useState<{ studentId: string; temporaryPassword: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function transition(newStatus: string) {
    setBusyStatus(newStatus);
    setError(null);
    try {
      const res = await api.patch<any>(`/admissions/${application.id}/status`, { status: newStatus });
      if (newStatus === "ENROLLED" && res?.student && res?.temporaryPassword) {
        setEnrollResult({ studentId: res.student.studentId, temporaryPassword: res.temporaryPassword });
      } else {
        onChanged();
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to update status");
    } finally {
      setBusyStatus(null);
    }
  }

  if (enrollResult) {
    return (
      <Modal title="Student Enrolled" onClose={() => { onChanged(); }}>
        <div className="space-y-4 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
          <p className="text-sm text-neutral-600">
            <strong>{application.studentName}</strong> has been enrolled as <span className="font-mono">{enrollResult.studentId}</span>. Share this
            temporary password with the parent — it will not be shown again.
          </p>
          <div className="flex items-center justify-center gap-2 rounded-md bg-neutral-100 px-4 py-3 font-mono text-sm">
            {enrollResult.temporaryPassword}
            <button
              onClick={() => {
                navigator.clipboard.writeText(enrollResult.temporaryPassword);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="rounded p-1 text-neutral-500 hover:bg-neutral-200"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <button onClick={() => { onChanged(); }} className="rounded-md bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy/90">
            Done
          </button>
        </div>
      </Modal>
    );
  }

  const nextStatuses = NEXT_STATUSES[application.status] ?? [];

  return (
    <Modal title={application.studentName} subtitle={application.applicationNumber} onClose={onClose} width="max-w-xl">
      <div className="space-y-4">
        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="flex items-center gap-2">
          <StatusBadge status={application.status} />
          {application.status !== "REJECTED" && application.status !== "ENROLLED" && <StatusBadge status={application.paymentStatus} />}
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <Info label="Date of Birth" value={application.dateOfBirth} />
          <Info label="Gender" value={humanize(application.gender)} />
          <Info label="Class Applying For" value={classById.get(application.classId) ?? application.classId} />
          <Info label="Previous School" value={application.previousSchool || "—"} />
          <Info label="Parent / Guardian" value={application.parentName} />
          <Info label="Phone" value={application.parentPhone} />
          <Info label="Email" value={application.parentEmail || "—"} />
          <Info label="Applied On" value={new Date(application.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} />
        </div>
        {application.address && (
          <div>
            <p className="text-xs font-medium text-neutral-500">Address</p>
            <p className="text-sm text-neutral-700">{application.address}</p>
          </div>
        )}
        {application.message && (
          <div>
            <p className="text-xs font-medium text-neutral-500">Message from applicant</p>
            <p className="whitespace-pre-wrap text-sm text-neutral-700">{application.message}</p>
          </div>
        )}

        {nextStatuses.length > 0 && (
          <div className="flex flex-wrap gap-2 border-t border-neutral-200 pt-4">
            {nextStatuses.map((s) => (
              <button
                key={s}
                onClick={() => transition(s)}
                disabled={busyStatus !== null}
                className={`rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50 ${
                  s === "REJECTED" ? "border border-red-300 text-red-700 hover:bg-red-50" : "bg-navy text-white hover:bg-navy/90"
                }`}
              >
                {busyStatus === s ? "Updating…" : `Mark ${humanize(s)}`}
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-neutral-500">{label}</p>
      <p className="text-sm text-neutral-800">{value}</p>
    </div>
  );
}

export default function AdminAdmissionsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [classes, setClasses] = useState<Ref[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<Application | null>(null);

  const classById = new Map(classes.map((c) => [c.id, c.name]));

  function load() {
    setLoading(true);
    const params = status ? `?status=${status}` : "";
    api
      .get<Application[]>(`/admissions${params}`)
      .then(setApplications)
      .catch((e) => setError(e.message || "Failed to load admissions"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    api.get<Ref[]>("/classes").then(setClasses).catch(() => {});
  }, []);
  useEffect(load, [status]);

  return (
    <AdminShell>
      <div className="ledger-bg border-b border-neutral-200 bg-white px-8 py-6">
        <p className="font-mono text-xs uppercase tracking-widest text-academic">Students</p>
        <h1 className="font-display text-2xl font-bold text-navy">Admissions</h1>
        <p className="mt-1 text-sm text-neutral-500">Enquiries submitted through the public-site &ldquo;Apply Now&rdquo; form appear here automatically.</p>
      </div>

      <div className="p-8">
        <div className="mb-4">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm">
            <option value="">All statuses</option>
            {["SUBMITTED", "UNDER_REVIEW", "APPROVED", "PAYMENT_PENDING", "PAYMENT_COMPLETED", "ENROLLED", "REJECTED"].map((s) => (
              <option key={s} value={s}>
                {humanize(s)}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-5 py-3 font-medium">Application #</th>
                <th className="px-5 py-3 font-medium">Student</th>
                <th className="px-5 py-3 font-medium">Class</th>
                <th className="px-5 py-3 font-medium">Parent</th>
                <th className="px-5 py-3 font-medium">Phone</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Applied</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-neutral-500">
                    <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                    Loading admissions…
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-red-600">
                    {error}
                  </td>
                </tr>
              )}
              {!loading && !error && applications.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-neutral-500">
                    <ClipboardList className="mx-auto mb-2 h-6 w-6 text-neutral-300" />
                    No admission enquiries yet.
                  </td>
                </tr>
              )}
              {!loading &&
                !error &&
                applications.map((a) => (
                  <tr key={a.id} onClick={() => setSelected(a)} className="cursor-pointer hover:bg-neutral-50">
                    <td className="px-5 py-3 font-mono text-xs text-neutral-500">{a.applicationNumber}</td>
                    <td className="px-5 py-3 font-medium text-navy">{a.studentName}</td>
                    <td className="px-5 py-3">{classById.get(a.classId) ?? a.classId}</td>
                    <td className="px-5 py-3">{a.parentName}</td>
                    <td className="px-5 py-3">{a.parentPhone}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="px-5 py-3 text-neutral-500">{new Date(a.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <DetailModal
          application={selected}
          classById={classById}
          onClose={() => setSelected(null)}
          onChanged={() => {
            setSelected(null);
            load();
          }}
        />
      )}
    </AdminShell>
  );
}
