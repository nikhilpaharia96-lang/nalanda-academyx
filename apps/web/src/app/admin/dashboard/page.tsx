"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { api } from "@/lib/api-client";
import { Users, GraduationCap, UsersRound, Wallet, TrendingUp, Loader2 } from "lucide-react";

interface DashboardStats {
  students: number;
  teachers: number;
  parents: number;
  pendingFees: { count: number; total: number };
  todayCollection: number;
}

function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<DashboardStats>("/dashboard/admin")
      .then(setStats)
      .catch((e) => setError(e.message || "Failed to load dashboard"));
  }, []);

  return (
    <AdminShell>
      <div className="ledger-bg border-b border-neutral-200 bg-white px-8 py-6">
        <p className="font-mono text-xs uppercase tracking-widest text-academic">Admin Portal</p>
        <h1 className="font-display text-2xl font-bold text-navy">Dashboard</h1>
      </div>

      <div className="p-8">
        {error && <p className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        {!stats && !error && (
          <div className="flex items-center gap-2 text-neutral-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading live figures from the database…
          </div>
        )}

        {stats && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={GraduationCap} label="Active Students" value={stats.students.toLocaleString()} />
            <StatCard icon={Users} label="Active Teachers" value={stats.teachers.toLocaleString()} />
            <StatCard icon={UsersRound} label="Registered Parents" value={stats.parents.toLocaleString()} />
            <StatCard
              icon={Wallet}
              label="Pending Fees"
              value={formatINR(stats.pendingFees.total)}
              sub={`${stats.pendingFees.count} fee record${stats.pendingFees.count === 1 ? "" : "s"}`}
              tone="warn"
            />
            <StatCard icon={TrendingUp} label="Today's Collection" value={formatINR(stats.todayCollection)} tone="good" />
          </div>
        )}

        {stats && stats.students === 0 && (
          <p className="mt-8 text-sm text-neutral-500">No students found. Add one from the Students page to get started.</p>
        )}
      </div>
    </AdminShell>
  );
}

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
        <Icon
          className={`h-4 w-4 ${tone === "good" ? "text-emerald-600" : tone === "warn" ? "text-gold-dark" : "text-academic"}`}
        />
      </div>
      <p className="mt-2 font-display text-2xl font-bold text-navy">{value}</p>
      {sub && <p className="mt-1 text-xs text-neutral-500">{sub}</p>}
    </div>
  );
}
