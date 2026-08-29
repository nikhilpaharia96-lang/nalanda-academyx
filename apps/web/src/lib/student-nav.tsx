import { LayoutDashboard, User, ClipboardCheck, Wallet, Award, Bell as BellIcon, FileText, Settings, Megaphone, CalendarDays } from "lucide-react";

export const STUDENT_NAV = [
  { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/student/profile", label: "Profile", icon: User },
  { href: "/student/attendance", label: "Attendance", icon: ClipboardCheck },
  { href: "/student/fees", label: "Fees & Payments", icon: Wallet },
  { href: "/student/results", label: "Results", icon: Award },
  { href: "/student/notices", label: "Notices", icon: Megaphone },
  { href: "/student/events", label: "Events", icon: CalendarDays },
  { href: "/student/notifications", label: "Notifications", icon: BellIcon },
  { href: "/student/documents", label: "Documents", icon: FileText },
  { href: "/student/settings", label: "Settings", icon: Settings },
];
