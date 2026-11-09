import { LayoutDashboard, ClipboardCheck, User, NotebookPen, CalendarOff } from "lucide-react";

export const TEACHER_NAV = [
  { href: "/teacher/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/teacher/attendance", label: "Attendance", icon: ClipboardCheck },
  { href: "/teacher/homework", label: "Homework", icon: NotebookPen },
  { href: "/teacher/leave", label: "Leave Requests", icon: CalendarOff },
  { href: "/teacher/profile", label: "Profile", icon: User },
];
