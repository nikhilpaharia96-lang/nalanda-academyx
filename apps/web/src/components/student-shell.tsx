"use client";

import { LayoutDashboard, ClipboardCheck, Wallet, CalendarClock } from "lucide-react";
import { MobileShell } from "./mobile-shell";

const BOTTOM_NAV = [
  { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/student/attendance", label: "Attendance", icon: ClipboardCheck },
  { href: "/student/fees", label: "Fees", icon: Wallet },
  { href: "/student/timetable", label: "Timetable", icon: CalendarClock },
];

type ShellProps = Omit<React.ComponentProps<typeof MobileShell>, "bottomNav" | "profileHref" | "profileEndpoint" | "notificationsHref">;

export function StudentShell(props: ShellProps) {
  return <MobileShell {...props} bottomNav={BOTTOM_NAV} profileHref="/student/profile" profileEndpoint="/students" notificationsHref="/student/notifications" />;
}
