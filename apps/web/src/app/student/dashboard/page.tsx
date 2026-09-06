"use client";

import { useEffect, useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import { STUDENT_NAV } from "@/lib/student-nav";
import { Loader2, ClipboardCheck, Wallet, Award, Megaphone } from "lucide-react";

interface StudentProfile {
  id: string;
  name: string;
  studentId: string;
  classId: string;
  sectionId: string;
  rollNumber: string;
}
interface AttendanceHistory { summary: { percentage: number | null; total: number } }
interface FeesResponse { monthlyFees: { status: string; amount: number }[]; extraFees: { status: string; amount: number }[] }
interface Notice { id: string; title: string; important: boolean; publishedAt: string }

function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [attendance, setAttendance] = useState<AttendanceHistory | null>(null);
  const [fees, setFees] = useState<FeesResponse | null>(null);
  const [notices, setNotices] = useState<Notice[] | null>(null);

  useEffect(() => {
    if (!user?.profileId) return;
    api.get<StudentProfile>(`/students/${user.profileId}`).then(setProfile);
    api.get<AttendanceHistory>(`/attendance/student/${user.profileId}`).then(setAttendance);
    api.get<FeesResponse>(`/fees/student/${user.profileId}`).then(setFees);
    api.get<Notice[]>("/notices").then((n) => setNotices(n.slice(0, 5)));
  }, [user?.profileId]);

  const pendingCount = fees ? fees.monthlyFees.filter((f) => f.status !== "PAID").length + fees.extraFees.filter((f) => f.status !== "PAID").length : 0;
  const pendingTotal = fees
    ? fees.monthlyFees.filter((f) => f.status !== "PAID").reduce((s, f) => s + f.amount, 0) + fees.extraFees.filter((f) => f.status !== "PAID").reduce((s, f) => s + f.amount, 0)
    : 0;

  return (
    <PortalShell navItems={STUDENT_NAV} loginPath="/student/login" allowedRoles={["STUDENT"]} portalLabel="Student Portal">
      <div className="ledger-bg border-b border-neutral-200 bg-white px-6 py-6 sm:px-8">
        <p className="font-mono text-xs uppercase tracking-widest text-academic">Student Portal</p>
        <h1 className="font-display text-2xl font-bold text-navy">{profile ? `Welcome, ${profile.name.replace("(DEMO) ", "")}` : "Dashboard"}</h1>
      </div>

      <div className="p-6 sm:p-8">
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard icon={ClipboardCheck} label="Attendance" value={attendance?.summary.percentage != null ? `${attendance.summary.percentage}%` : "—"} />
          <StatCard icon={Wallet} label="Pending Fees" value={fees ? formatINR(pendingTotal) : "—"} sub={pendingCount > 0 ? `${pendingCount} due` : "All caught up"} tone={pendingCount > 0 ? "warn" : "good"} />
          <StatCard icon={Award} label="Roll Number" value={profile?.rollNumber ?? "—"} />
        </div>

        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          <Megaphone className="h-4 w-4" /> Latest Notices
        </h2>
        {!notices && (
          <div className="flex items-center gap-2 text-neutral-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        )}
        {notices && notices.length === 0 && <p className="text-sm text-neutral-500">No notices published yet.</p>}
        <ul className="space-y-2">
          {notices?.map((n) => (
            <li key={n.id} className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-4 py-3 shadow-sm">
              <span className="text-sm text-navy">{n.title}</span>
              {n.important && <span className="rounded-full bg-gold/15 px-2 py-0.5 text-xs font-medium text-gold-dark">Important</span>}
            </li>
          ))}
        </ul>
      </div>
    </PortalShell>
  );
}

function StatCard({ icon: Icon, label, value, sub, tone }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; sub?: string; tone?: "good" | "warn" }) {
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
