"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { StudentShell } from "@/components/student-shell";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import { payFee } from "@/lib/razorpay";
import { STUDENT_NAV } from "@/lib/student-nav";
import { Loader2 } from "lucide-react";

interface StudentProfile {
  id: string;
  name: string;
  studentId: string;
  classId: string;
  sectionId: string;
  rollNumber: string;
}
interface AttendanceHistory {
  summary: { percentage: number | null; total: number; present: number };
}
interface FeeRow {
  id: string;
  amount: number;
  remainingAmount: number;
  dueDate: string;
  status: string;
}
interface FeesResponse {
  monthlyFees: FeeRow[];
  extraFees: FeeRow[];
}
interface Notice {
  id: string;
  title: string;
  important: boolean;
  publishedAt: string;
}

function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

function formatLongDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [attendance, setAttendance] = useState<AttendanceHistory | null>(null);
  const [fees, setFees] = useState<FeesResponse | null>(null);
  const [notices, setNotices] = useState<Notice[] | null>(null);
  const [paying, setPaying] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadFees = useCallback(() => {
    if (!user?.profileId) return;
    api.get<FeesResponse>(`/fees/student/${user.profileId}`).then(setFees);
  }, [user?.profileId]);

  useEffect(() => {
    if (!user?.profileId) return;
    api.get<StudentProfile>(`/students/${user.profileId}`).then(setProfile);
    api.get<AttendanceHistory>(`/attendance/student/${user.profileId}`).then(setAttendance);
    api.get<Notice[]>("/notices").then((n) => setNotices(n.slice(0, 5)));
    loadFees();
  }, [user?.profileId, loadFees]);

  const pendingMonthly = fees?.monthlyFees.filter((f) => f.status !== "PAID" && f.status !== "WAIVED") ?? [];
  const pendingExtra = fees?.extraFees.filter((f) => f.status !== "PAID" && f.status !== "WAIVED") ?? [];
  const allPending = [...pendingMonthly.map((f) => ({ kind: "monthly" as const, fee: f })), ...pendingExtra.map((f) => ({ kind: "extra" as const, fee: f }))].sort(
    (a, b) => new Date(a.fee.dueDate).getTime() - new Date(b.fee.dueDate).getTime(),
  );
  const pendingTotal = allPending.reduce((s, p) => s + p.fee.remainingAmount, 0);
  const next = allPending[0];

  async function handlePay() {
    if (!next) return;
    setPaying(true);
    setMessage(null);
    await payFee({
      studentFeeId: next.kind === "monthly" ? next.fee.id : undefined,
      extraFeeId: next.kind === "extra" ? next.fee.id : undefined,
      amount: next.fee.remainingAmount,
      studentName: profile?.name ?? user?.email ?? "Student",
      studentEmail: user?.email,
      onSuccess: () => {
        setMessage({ type: "success", text: "Payment successful! Your receipt is available in Fees." });
        setPaying(false);
        loadFees();
      },
      onError: (msg) => {
        setMessage({ type: "error", text: msg });
        setPaying(false);
      },
    });
  }

  const pct = attendance?.summary.percentage ?? null;
  const today = new Date();

  return (
    <StudentShell navItems={STUDENT_NAV} loginPath="/student/login" allowedRoles={["STUDENT"]} portalLabel="Student Portal">
      <div className="mx-auto max-w-3xl space-y-4 p-4 sm:p-6">
        {/* Welcome banner */}
        <section className="relative overflow-hidden rounded-3xl bg-portal p-6 text-white shadow-md">
          <div className="relative z-10 max-w-[65%]">
            <h2 className="font-display text-xl font-bold leading-tight sm:text-3xl">
              Welcome back, {profile ? profile.name.replace("(DEMO) ", "") : "Student"}!
            </h2>
            <p className="mt-3 text-sm text-blue-100 sm:text-base">Current date - {formatLongDate(today)}</p>
            <p className="text-sm text-blue-100 sm:text-base">Nalanda Academy Student Portal</p>
          </div>
          <StudentIllustration />
        </section>

        {message && (
          <div className={`rounded-2xl px-4 py-3 text-sm ${message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`} role="status">
            {message.text}
          </div>
        )}

        {/* Attendance */}
        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <h3 className="font-display text-xl font-bold text-slate-900">Attendance</h3>
          <div className="mt-4 flex items-center gap-5">
            <AttendanceRing percentage={pct} />
            <dl className="flex-1 space-y-3 text-base">
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-2 text-slate-700">
                  <span className="h-3 w-3 rounded-full bg-portal" /> Total Days:
                </dt>
                <dd className="font-bold text-slate-900">{attendance ? attendance.summary.total : "—"}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-2 text-slate-700">
                  <span className="h-3 w-3 rounded-full bg-emerald-500" /> Present:
                </dt>
                <dd className="font-bold text-slate-900">{attendance ? attendance.summary.present : "—"}</dd>
              </div>
            </dl>
          </div>
        </section>

        {/* Fees */}
        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <h3 className="font-display text-xl font-bold text-slate-900">Fees &amp; Payments</h3>
          {!fees ? (
            <div className="mt-4 flex items-center gap-2 text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : next ? (
            <>
              <p className="mt-3 font-display text-4xl font-extrabold text-slate-900">{formatINR(pendingTotal)}</p>
              <p className="mt-1 text-slate-500">
                due on {formatLongDate(new Date(next.fee.dueDate))}
                {allPending.length > 1 && ` · ${allPending.length} pending`}
              </p>
              <button
                onClick={handlePay}
                disabled={paying}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-portal bg-portal-soft px-4 py-3 text-base font-semibold text-portal-dark transition hover:bg-blue-100 disabled:opacity-60"
              >
                {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Pay Online with Razorpay
              </button>
              <Link href="/student/fees" className="mt-3 block text-center text-sm font-medium text-portal hover:underline">
                View all fees &amp; receipts
              </Link>
            </>
          ) : (
            <>
              <p className="mt-3 font-display text-3xl font-extrabold text-emerald-600">All caught up</p>
              <p className="mt-1 text-slate-500">No pending fees right now.</p>
              <Link href="/student/fees" className="mt-3 block text-sm font-medium text-portal hover:underline">
                View payment history
              </Link>
            </>
          )}
        </section>

        {/* Latest notices */}
        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <h3 className="font-display text-xl font-bold text-slate-900">Latest Notices</h3>
          {!notices && (
            <div className="mt-4 flex items-center gap-2 text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          )}
          {notices && notices.length === 0 && <p className="mt-3 text-sm text-slate-500">No notices published yet.</p>}
          <ul className="mt-2 divide-y divide-slate-200">
            {notices?.map((n) => (
              <li key={n.id}>
                <Link href="/student/notices" className="flex items-center justify-between gap-3 py-3.5">
                  <span className="text-base text-slate-900">
                    {n.title}
                    {n.important && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 align-middle text-xs font-medium text-amber-700">Important</span>}
                  </span>
                  <DateChip iso={n.publishedAt} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </StudentShell>
  );
}

function AttendanceRing({ percentage }: { percentage: number | null }) {
  const size = 116;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const value = Math.max(0, Math.min(100, percentage ?? 0));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E2E8F0" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#0E6FDC"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (value / 100) * c}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-display text-3xl font-extrabold text-slate-900">
        {percentage != null ? `${percentage}%` : "—"}
      </span>
    </div>
  );
}

function DateChip({ iso }: { iso: string }) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const recent = Date.now() - d.getTime() < 4 * 24 * 60 * 60 * 1000;
  return (
    <span
      className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl text-center leading-tight ${
        recent ? "bg-portal text-white" : "bg-portal-soft text-slate-800"
      }`}
    >
      <span className="text-base font-bold">{d.getDate()}</span>
      <span className="text-xs">{d.toLocaleDateString("en-US", { month: "short" })}</span>
    </span>
  );
}

/** Simple original illustration of a student with books, used in the banner. */
function StudentIllustration() {
  return (
    <svg viewBox="0 0 160 160" className="absolute bottom-0 right-3 h-36 w-36 sm:h-44 sm:w-44" aria-hidden="true">
      <circle cx="86" cy="70" r="58" fill="#3B8BEA" opacity="0.55" />
      <rect x="18" y="132" width="52" height="8" rx="2" fill="#E5484D" />
      <rect x="14" y="124" width="52" height="8" rx="2" fill="#F8FAFC" />
      <rect x="20" y="116" width="46" height="8" rx="2" fill="#F5C451" />
      <path d="M52 160c0-30 14-48 36-48s36 18 36 48z" fill="#1D3A73" />
      <path d="M78 112l10 14 10-14z" fill="#F8FAFC" />
      <rect x="80" y="96" width="16" height="18" rx="6" fill="#F6B58A" />
      <circle cx="88" cy="76" r="22" fill="#F6B58A" />
      <path d="M66 74c-2-22 14-34 30-30 12 3 18 14 16 28-6-8-14-12-26-12-8 0-14 6-20 14z" fill="#1B2440" />
      <circle cx="80" cy="78" r="2.4" fill="#1B2440" />
      <circle cx="96" cy="78" r="2.4" fill="#1B2440" />
      <path d="M81 87q7 6 14 0" stroke="#1B2440" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <rect x="116" y="74" width="26" height="34" rx="3" fill="#F5C451" transform="rotate(14 129 91)" />
      <path d="M62 112q-14-14-8-34" stroke="#F6B58A" strokeWidth="9" fill="none" strokeLinecap="round" />
    </svg>
  );
}
