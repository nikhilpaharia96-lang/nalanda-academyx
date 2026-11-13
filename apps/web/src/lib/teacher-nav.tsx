import { LayoutDashboard, ClipboardCheck, User, NotebookPen, CalendarOff, Wallet } from "lucide-react";

export const TEACHER_NAV = [
  { href: "/teacher/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/teacher/attendance", label: "Attendance", icon: ClipboardCheck },
  { href: "/teacher/homework", label: "Homework", icon: NotebookPen },
  { href: "/teacher/leave", label: "Leave Requests", icon: CalendarOff },
  { href: "/teacher/payslips", label: "Payslips", icon: Wallet },
  { href: "/teacher/profile", label: "Profile", icon: User },
];
