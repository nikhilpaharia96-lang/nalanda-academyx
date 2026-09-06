"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { api, ApiError } from "@/lib/api-client";
import {
  Users,
  GraduationCap,
  UsersRound,
  Wallet,
  TrendingUp,
  CalendarDays,
  Layers,
  Landmark,
  Loader2,
  AlertTriangle,
  RefreshCw,
  ClipboardCheck,
  UserPlus,
  Receipt,
  Activity,
  Megaphone,
  ChevronRight,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types (mirrors the real shapes returned by apps/api/src/dashboard)
// ---------------------------------------------------------------------------

interface SummaryStats {
  totalStudents: number;
  activeStudents: number;
  totalTeachers: number;
  totalParents: number;
  totalClasses: number;
  totalFeesCollected: number;
  pendingFees: { count: number; total: number };
  todayCollection: number;
  monthCollection: number;
}

interface FeeCollectionPoint {
  date: string;
  paid: number;
  pending: number;
}

interface AttendanceOverview {
  date: string;
  present: number;
  absent: number;
  late: number;
  leave: number;
  marked: number;
  totalActiveStudents: number;
  notMarked: number;
  attendancePercentage: number | null;
}

interface RecentAdmission {
  id: string;
  name: string;
  admissionNumber: string;
  rollNumber: string;
  admissionDate: string;
  status: string;
  photoUrl: string | null;
  className: string | null;
  sectionName: string | null;
}

interface RecentPayment {
  id: string;
  amount: number;
  currency: string;
  paymentType: string;
  gateway: string;
  method: string | null;
  status: string;
  transactionId: string | null;
  paymentId: string | null;
  paidAt: string | null;
  createdAt: string;
  studentId: string | null;
  studentName: string | null;
}

interface AuditLogEntry {
  id: string;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  description: string | null;
  createdAt: string;
}

interface NoticeEntry {
  id: string;
  title: string;
  slug: string;
  category: string;
  important: boolean;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

function formatDate(value: string | null | undefined, opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" }) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", opts).format(d);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(d);
}

function formatActionLabel(action: string) {
  return action
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function statusTone(status: string): string {
  switch (status) {
    case "PAID":
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700";
    case "PENDING":
    case "PROCESSING":
    case "PARTIALLY_PAID":
      return "bg-amber-50 text-amber-700";
    case "FAILED":
    case "CANCELLED":
    case "INACTIVE":
      return "bg-red-50 text-red-700";
    case "REFUNDED":
      return "bg-neutral-100 text-neutral-600";
    default:
      return "bg-neutral-100 text-neutral-600";
  }
}

// ---------------------------------------------------------------------------
// Generic async-section hook: loading / error / retry, one per dashboard card
// ---------------------------------------------------------------------------

function useDashboardData<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .get<T>(path)
      .then((res) => setData(res))
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load data"))
      .finally(() => setLoading(false));
  }, [path]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, error, loading, retry: load };
}

// ---------------------------------------------------------------------------
// Shared small components
// ---------------------------------------------------------------------------

function SectionCard({
  title,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-academic" />
          <h2 className="font-display text-sm font-semibold text-navy">{title}</h2>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function InlineLoading({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-sm text-neutral-500">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

function InlineError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <AlertTriangle className="h-5 w-5 text-red-500" />
      <p className="text-sm text-red-600">{message}</p>
      <button
        onClick={onRetry}
        className="mt-1 inline-flex items-center gap-1.5 rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Retry
      </button>
    </div>
  );
}

function InlineEmpty({ icon: Icon, message }: { icon: React.ComponentType<{ className?: string }>; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-neutral-400">
      <Icon className="h-6 w-6" />
      <p className="text-sm text-neutral-500">{message}</p>
    </div>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-neutral-200 ${className || ""}`} />;
}

// ---------------------------------------------------------------------------
// Top stat cards
// ---------------------------------------------------------------------------

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  tone?: "good" | "warn";
}) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</span>
        <Icon className={`h-4 w-4 ${tone === "good" ? "text-emerald-600" : tone === "warn" ? "text-gold-dark" : "text-academic"}`} />
      </div>
      <p className="mt-2 font-display text-2xl font-bold text-navy">{value}</p>
      {sub && <p className="mt-1 text-xs text-neutral-500">{sub}</p>}
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
      <Skeleton className="mt-3 h-7 w-20" />
    </div>
  );
}

function StatCardsSection() {
  const { data, error, loading, retry } = useDashboardData<SummaryStats>("/dashboard/admin");

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 9 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return <InlineError message={error || "Failed to load dashboard statistics."} onRetry={retry} />;
  }

  // Defensive fallbacks: if an older/partial API response ever reaches the
  // client (e.g. a stale server process before a rebuild finishes), render
  // 0 / ₹0 instead of throwing — the numbers will simply look wrong for a
  // moment rather than crashing the whole dashboard.
  const totalStudents = data.totalStudents ?? 0;
  const activeStudents = data.activeStudents ?? 0;
  const totalTeachers = data.totalTeachers ?? 0;
  const totalParents = data.totalParents ?? 0;
  const totalClasses = data.totalClasses ?? 0;
  const totalFeesCollected = data.totalFeesCollected ?? 0;
  const pendingFeesTotal = data.pendingFees?.total ?? 0;
  const pendingFeesCount = data.pendingFees?.count ?? 0;
  const todayCollection = data.todayCollection ?? 0;
  const monthCollection = data.monthCollection ?? 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <StatCard icon={GraduationCap} label="Total Students" value={totalStudents.toLocaleString("en-IN")} />
      <StatCard icon={GraduationCap} label="Active Students" value={activeStudents.toLocaleString("en-IN")} />
      <StatCard icon={Users} label="Total Teachers" value={totalTeachers.toLocaleString("en-IN")} />
      <StatCard icon={UsersRound} label="Total Parents" value={totalParents.toLocaleString("en-IN")} />
      <StatCard icon={Layers} label="Total Classes" value={totalClasses.toLocaleString("en-IN")} />
      <StatCard icon={Landmark} label="Total Fees Collected" value={formatINR(totalFeesCollected)} tone="good" />
      <StatCard
        icon={Wallet}
        label="Pending Fees"
        value={formatINR(pendingFeesTotal)}
        sub={`${pendingFeesCount} fee record${pendingFeesCount === 1 ? "" : "s"}`}
        tone="warn"
      />
      <StatCard icon={TrendingUp} label="Today's Collection" value={formatINR(todayCollection)} tone="good" />
      <StatCard icon={CalendarDays} label="This Month's Collection" value={formatINR(monthCollection)} tone="good" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fee collection chart (simple, dependency-free bar chart in SVG)
// ---------------------------------------------------------------------------

function FeeCollectionChart() {
  const [days, setDays] = useState(14);
  const { data, error, loading, retry } = useDashboardData<FeeCollectionPoint[]>(`/dashboard/admin/fee-collection?days=${days}`);

  const rangeOptions: { label: string; value: number }[] = [
    { label: "7D", value: 7 },
    { label: "14D", value: 14 },
    { label: "30D", value: 30 },
  ];

  return (
    <SectionCard
      title="Fee Collection"
      icon={TrendingUp}
      action={
        <div className="flex gap-1 rounded-md border border-neutral-200 p-0.5">
          {rangeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDays(opt.value)}
              className={`rounded px-2 py-1 text-xs font-medium transition ${
                days === opt.value ? "bg-academic text-white" : "text-neutral-500 hover:bg-neutral-100"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      }
    >
      {loading && <InlineLoading label="Loading collection data…" />}
      {!loading && error && <InlineError message={error} onRetry={retry} />}
      {!loading && !error && data && data.every((p) => p.paid === 0 && p.pending === 0) && (
        <InlineEmpty icon={TrendingUp} message={`No paid or due fee activity in the last ${days} days.`} />
      )}
      {!loading && !error && data && !data.every((p) => p.paid === 0 && p.pending === 0) && (
        <FeeChartBody points={data} />
      )}
    </SectionCard>
  );
}

function FeeChartBody({ points }: { points: FeeCollectionPoint[] }) {
  const max = Math.max(1, ...points.map((p) => Math.max(p.paid, p.pending)));
  const totalPaid = points.reduce((s, p) => s + p.paid, 0);
  const totalPending = points.reduce((s, p) => s + p.pending, 0);

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
          <span className="text-neutral-500">Paid</span>
          <span className="font-semibold text-navy">{formatINR(totalPaid)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm bg-gold" />
          <span className="text-neutral-500">Due (by due date)</span>
          <span className="font-semibold text-navy">{formatINR(totalPending)}</span>
        </div>
      </div>

      <div className="flex items-end gap-1.5 overflow-x-auto pb-2" role="img" aria-label="Daily fee collection chart">
        {points.map((p) => {
          const paidHeight = Math.round((p.paid / max) * 100);
          const pendingHeight = Math.round((p.pending / max) * 100);
          const d = new Date(p.date);
          const dayLabel = Number.isNaN(d.getTime()) ? p.date.slice(8, 10) : d.getDate();
          const monthLabel = Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-IN", { month: "short" });
          return (
            <div key={p.date} className="flex min-w-[28px] flex-1 flex-col items-center gap-1">
              <div className="flex h-32 w-full items-end justify-center gap-0.5" title={`${formatDate(p.date)}: paid ${formatINR(p.paid)}, due ${formatINR(p.pending)}`}>
                <div className="w-2.5 rounded-t-sm bg-emerald-500 transition-all" style={{ height: `${Math.max(paidHeight, p.paid > 0 ? 4 : 0)}%` }} />
                <div className="w-2.5 rounded-t-sm bg-gold transition-all" style={{ height: `${Math.max(pendingHeight, p.pending > 0 ? 4 : 0)}%` }} />
              </div>
              <span className="text-[10px] leading-tight text-neutral-400">{dayLabel}</span>
              <span className="text-[9px] leading-tight text-neutral-300">{monthLabel}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Attendance overview
// ---------------------------------------------------------------------------

function AttendanceOverviewSection() {
  const { data, error, loading, retry } = useDashboardData<AttendanceOverview>("/dashboard/admin/attendance-overview");

  return (
    <SectionCard title="Attendance Overview — Today" icon={ClipboardCheck}>
      {loading && <InlineLoading label="Loading attendance…" />}
      {!loading && error && <InlineError message={error} onRetry={retry} />}
      {!loading && !error && data && data.marked === 0 && (
        <InlineEmpty icon={ClipboardCheck} message="No attendance has been marked for today yet." />
      )}
      {!loading && !error && data && data.marked > 0 && (
        <div>
          <div className="mb-4 flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 border-academic/20 text-center">
              <span className="font-display text-lg font-bold text-navy">
                {data.attendancePercentage !== null ? `${data.attendancePercentage}%` : "—"}
              </span>
            </div>
            <div className="text-sm text-neutral-500">
              <p>
                <span className="font-semibold text-navy">{data.marked}</span> of {data.totalActiveStudents} active students marked
              </p>
              {data.notMarked > 0 && <p className="text-xs text-neutral-400">{data.notMarked} not yet marked</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <AttendancePill label="Present" value={data.present} tone="bg-emerald-50 text-emerald-700" />
            <AttendancePill label="Absent" value={data.absent} tone="bg-red-50 text-red-700" />
            <AttendancePill label="Late" value={data.late} tone="bg-amber-50 text-amber-700" />
            <AttendancePill label="Leave" value={data.leave} tone="bg-neutral-100 text-neutral-600" />
          </div>
        </div>
      )}
    </SectionCard>
  );
}

function AttendancePill({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={`rounded-md px-3 py-2 text-center ${tone}`}>
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[11px] font-medium uppercase tracking-wide">{label}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Recent admissions
// ---------------------------------------------------------------------------

function RecentAdmissionsSection() {
  const { data, error, loading, retry } = useDashboardData<RecentAdmission[]>("/dashboard/admin/recent-admissions?limit=6");

  return (
    <SectionCard
      title="Recent Student Admissions"
      icon={UserPlus}
      action={
        <Link href="/admin/students" className="flex items-center gap-1 text-xs font-medium text-academic hover:underline">
          View all <ChevronRight className="h-3 w-3" />
        </Link>
      }
    >
      {loading && <InlineLoading label="Loading recent admissions…" />}
      {!loading && error && <InlineError message={error} onRetry={retry} />}
      {!loading && !error && data && data.length === 0 && <InlineEmpty icon={UserPlus} message="No students admitted yet." />}
      {!loading && !error && data && data.length > 0 && (
        <div className="-mx-5 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-neutral-400">
              <tr>
                <th className="px-5 pb-2 font-medium">Student</th>
                <th className="px-5 pb-2 font-medium">Admission No.</th>
                <th className="px-5 pb-2 font-medium">Class</th>
                <th className="px-5 pb-2 font-medium">Admitted</th>
                <th className="px-5 pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {data.map((s) => (
                <tr key={s.id}>
                  <td className="px-5 py-2.5">
                    <div className="flex items-center gap-2.5">
                      {s.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.photoUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-academic/10 text-xs font-semibold text-academic">
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="font-medium text-navy">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-2.5 font-mono text-xs text-neutral-600">{s.admissionNumber}</td>
                  <td className="px-5 py-2.5 text-neutral-600">
                    {s.className ? `${s.className}${s.sectionName ? ` - ${s.sectionName}` : ""}` : "—"}
                  </td>
                  <td className="px-5 py-2.5 text-neutral-600">{formatDate(s.admissionDate)}</td>
                  <td className="px-5 py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusTone(s.status)}`}>{s.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Recent payments
// ---------------------------------------------------------------------------

function RecentPaymentsSection() {
  const { data, error, loading, retry } = useDashboardData<RecentPayment[]>("/dashboard/admin/recent-payments?limit=6");

  return (
    <SectionCard title="Recent Payments" icon={Receipt}>
      {loading && <InlineLoading label="Loading recent payments…" />}
      {!loading && error && <InlineError message={error} onRetry={retry} />}
      {!loading && !error && data && data.length === 0 && <InlineEmpty icon={Receipt} message="No payments recorded yet." />}
      {!loading && !error && data && data.length > 0 && (
        <div className="-mx-5 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-neutral-400">
              <tr>
                <th className="px-5 pb-2 font-medium">Student</th>
                <th className="px-5 pb-2 font-medium">Amount</th>
                <th className="px-5 pb-2 font-medium">Date</th>
                <th className="px-5 pb-2 font-medium">Method</th>
                <th className="px-5 pb-2 font-medium">Reference</th>
                <th className="px-5 pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {data.map((p) => (
                <tr key={p.id}>
                  <td className="px-5 py-2.5 font-medium text-navy">{p.studentName || "—"}</td>
                  <td className="px-5 py-2.5 font-semibold text-navy">{formatINR(p.amount)}</td>
                  <td className="px-5 py-2.5 text-neutral-600">{formatDate(p.paidAt || p.createdAt)}</td>
                  <td className="px-5 py-2.5 text-neutral-600">{p.method ? p.method.replace(/_/g, " ") : p.gateway.replace(/_/g, " ")}</td>
                  <td className="px-5 py-2.5 font-mono text-xs text-neutral-500">{p.transactionId || p.paymentId || "—"}</td>
                  <td className="px-5 py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusTone(p.status)}`}>{p.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Recent activities (audit log)
// ---------------------------------------------------------------------------

function RecentActivitiesSection() {
  const { data, error, loading, retry } = useDashboardData<AuditLogEntry[]>("/dashboard/admin/recent-activities?limit=8");

  return (
    <SectionCard title="Recent Activities" icon={Activity}>
      {loading && <InlineLoading label="Loading recent activities…" />}
      {!loading && error && <InlineError message={error} onRetry={retry} />}
      {!loading && !error && data && data.length === 0 && <InlineEmpty icon={Activity} message="No recent activity recorded yet." />}
      {!loading && !error && data && data.length > 0 && (
        <ul className="space-y-3">
          {data.map((log) => (
            <li key={log.id} className="flex items-start gap-3 text-sm">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-academic" />
              <div className="min-w-0 flex-1">
                <p className="text-navy">
                  <span className="font-medium">{formatActionLabel(log.action)}</span>
                  {log.description ? <span className="text-neutral-500"> — {log.description}</span> : null}
                </p>
                <p className="text-xs text-neutral-400">
                  {log.entity}
                  {log.entityId ? ` #${log.entityId.slice(0, 8)}` : ""} · {formatDateTime(log.createdAt)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Latest notices
// ---------------------------------------------------------------------------

function LatestNoticesSection() {
  const { data, error, loading, retry } = useDashboardData<NoticeEntry[]>("/dashboard/admin/notices?limit=5");

  return (
    <SectionCard
      title="Latest Notices"
      icon={Megaphone}
      action={
        <Link href="/admin/notices" className="flex items-center gap-1 text-xs font-medium text-academic hover:underline">
          Manage <ChevronRight className="h-3 w-3" />
        </Link>
      }
    >
      {loading && <InlineLoading label="Loading notices…" />}
      {!loading && error && <InlineError message={error} onRetry={retry} />}
      {!loading && !error && data && data.length === 0 && <InlineEmpty icon={Megaphone} message="No published notices yet." />}
      {!loading && !error && data && data.length > 0 && (
        <ul className="divide-y divide-neutral-100">
          {data.map((notice) => (
            <li key={notice.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-navy">{notice.title}</p>
                <p className="text-xs text-neutral-400">
                  {notice.category} · Published {formatDate(notice.publishedAt || notice.createdAt)}
                </p>
              </div>
              {notice.important && (
                <span className="shrink-0 rounded-full bg-gold/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold-dark">
                  Important
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminDashboardPage() {
  return (
    <AdminShell>
      <div className="ledger-bg border-b border-neutral-200 bg-white px-6 py-6 md:px-8">
        <p className="font-mono text-xs uppercase tracking-widest text-academic">Admin Portal</p>
        <h1 className="font-display text-2xl font-bold text-navy">Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-500">A live overview of Nalanda Academy — every figure below comes from the database.</p>
      </div>

      <div className="space-y-6 p-6 md:p-8">
        <StatCardsSection />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <FeeCollectionChart />
          </div>
          <AttendanceOverviewSection />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <RecentAdmissionsSection />
          <RecentPaymentsSection />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <RecentActivitiesSection />
          <LatestNoticesSection />
        </div>
      </div>
    </AdminShell>
  );
}
