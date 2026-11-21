"use client";

import { LayoutDashboard, ClipboardCheck, NotebookPen, CalendarOff } from "lucide-react";
import { MobileShell } from "./mobile-shell";

const BOTTOM_NAV = [
  { href: "/teacher/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/teacher/attendance", label: "Attendance", icon: ClipboardCheck },
  { href: "/teacher/homework", label: "Homework", icon: NotebookPen },
  { href: "/teacher/leave", label: "Leave Requests", icon: CalendarOff },
];

type ShellProps = Omit<React.ComponentProps<typeof MobileShell>, "bottomNav" | "profileHref" | "profileEndpoint" | "notificationsHref">;

export function TeacherShell(props: ShellProps) {
  return <MobileShell {...props} bottomNav={BOTTOM_NAV} profileHref="/teacher/profile" profileEndpoint="/teachers" />;
}
