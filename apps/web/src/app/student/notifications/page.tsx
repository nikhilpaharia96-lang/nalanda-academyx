"use client";

import { useEffect, useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import { api } from "@/lib/api-client";
import { STUDENT_NAV } from "@/lib/student-nav";
import { Loader2, Bell } from "lucide-react";

interface Notification { id: string; title: string; message: string; type: string; readAt: string | null; createdAt: string }

export default function StudentNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[] | null>(null);

  function load() {
    api.get<Notification[]>("/notifications").then(setNotifications);
  }
  useEffect(load, []);

  async function markRead(id: string) {
    await api.patch(`/notifications/${id}/read`);
    load();
  }

  return (
    <PortalShell navItems={STUDENT_NAV} loginPath="/student/login" allowedRoles={["STUDENT"]} portalLabel="Student Portal">
      <div className="ledger-bg border-b border-neutral-200 bg-white px-6 py-6 sm:px-8">
        <p className="font-mono text-xs uppercase tracking-widest text-academic">Student Portal</p>
        <h1 className="font-display text-2xl font-bold text-navy">Notifications</h1>
      </div>

      <div className="p-6 sm:p-8">
        {!notifications && (
          <div className="flex items-center gap-2 text-neutral-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        )}
        {notifications && notifications.length === 0 && <p className="text-sm text-neutral-500">No notifications yet.</p>}
        <div className="space-y-2">
          {notifications?.map((n) => (
            <div key={n.id} className={`flex items-start gap-3 rounded-lg border p-4 shadow-sm ${n.readAt ? "border-neutral-200 bg-white" : "border-academic/30 bg-academic/5"}`}>
              <Bell className={`mt-0.5 h-4 w-4 ${n.readAt ? "text-neutral-400" : "text-academic"}`} />
              <div className="flex-1">
                <p className="text-sm font-medium text-navy">{n.title}</p>
                <p className="text-sm text-neutral-600">{n.message}</p>
                <p className="mt-1 font-mono text-xs text-neutral-400">{n.createdAt.slice(0, 10)}</p>
              </div>
              {!n.readAt && (
                <button onClick={() => markRead(n.id)} className="whitespace-nowrap text-xs font-medium text-academic hover:underline">
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </PortalShell>
  );
}
