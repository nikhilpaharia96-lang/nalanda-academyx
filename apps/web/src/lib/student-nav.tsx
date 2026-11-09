import { LayoutDashboard, User, ClipboardCheck, Wallet, Award, Bell as BellIcon, FileText, Settings, Megaphone, CalendarDays, ShoppingCart, CalendarClock, BookOpen, NotebookPen, CalendarOff, Bus, FileBadge } from "lucide-react";

export const STUDENT_NAV = [
  { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/student/profile", label: "Profile", icon: User },
  { href: "/student/attendance", label: "Attendance", icon: ClipboardCheck },
  { href: "/student/fees", label: "Fees & Payments", icon: Wallet },
  { href: "/student/timetable", label: "Timetable", icon: CalendarClock },
  { href: "/student/homework", label: "Homework", icon: NotebookPen },
  { href: "/student/leave", label: "Leave", icon: CalendarOff },
  { href: "/student/transport", label: "Transport", icon: Bus },
  { href: "/student/certificates", label: "Certificates", icon: FileBadge },
  { href: "/student/library", label: "Library", icon: BookOpen },
  { href: "/student/results", label: "Results", icon: Award },
  { href: "/student/store", label: "School Store", icon: ShoppingCart, CalendarClock, BookOpen, NotebookPen, CalendarOff, Bus, FileBadge },
  { href: "/student/notices", label: "Notices", icon: Megaphone },
  { href: "/student/events", label: "Events", icon: CalendarDays },
  { href: "/student/notifications", label: "Notifications", icon: BellIcon },
  { href: "/student/documents", label: "Documents", icon: FileText },
  { href: "/student/settings", label: "Settings", icon: Settings },
];
