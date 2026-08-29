import { LayoutDashboard, ClipboardCheck, Wallet, Award, Bell as BellIcon, FileText, Settings, Megaphone, CalendarDays, Users } from "lucide-react";

export const PARENT_NAV = [
  { href: "/parent/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/parent/children", label: "My Children", icon: Users },
  { href: "/parent/attendance", label: "Attendance", icon: ClipboardCheck },
  { href: "/parent/fees", label: "Fees & Payments", icon: Wallet },
  { href: "/parent/results", label: "Results", icon: Award },
  { href: "/parent/notices", label: "Notices", icon: Megaphone },
  { href: "/parent/events", label: "Events", icon: CalendarDays },
  { href: "/parent/notifications", label: "Notifications", icon: BellIcon },
  { href: "/parent/documents", label: "Documents", icon: FileText },
  { href: "/parent/settings", label: "Settings", icon: Settings },
];
