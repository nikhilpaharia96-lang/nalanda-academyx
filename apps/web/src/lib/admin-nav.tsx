import {
  LayoutDashboard,
  Users,
  UserPlus,
  ClipboardList,
  GraduationCap,
  UserCog,
  Wallet,
  CreditCard,
  AlertCircle,
  Receipt,
  BarChart3,
  CalendarCheck,
  Building2,
  UsersRound,
  Award,
  Megaphone,
  FolderKanban,
  FileBarChart,
  Settings,
} from "lucide-react";

export interface AdminNavLeaf {
  href: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  /** True once the page behind this link is actually implemented. Items with
   * comingSoon are still shown (so the full information architecture is
   * visible), but are visually marked and — for now — route to a real
   * "coming soon" placeholder rather than a broken or fake page. */
  comingSoon?: boolean;
}

export interface AdminNavGroup {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** A group with no children is itself a single link (e.g. Dashboard, Attendance). */
  href?: string;
  children?: AdminNavLeaf[];
  comingSoon?: boolean;
}

export const ADMIN_NAV: AdminNavGroup[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
  {
    label: "Students",
    icon: Users,
    children: [
      { href: "/admin/students", label: "All Students" },
      { href: "/admin/students/new", label: "Add Student", icon: UserPlus, comingSoon: true },
      { href: "/admin/admissions", label: "Admissions", icon: ClipboardList, comingSoon: true },
    ],
  },
  {
    label: "Teachers",
    icon: GraduationCap,
    children: [
      { href: "/admin/teachers", label: "All Teachers", comingSoon: true },
      { href: "/admin/teachers/new", label: "Add Teacher", icon: UserCog, comingSoon: true },
    ],
  },
  {
    label: "Fees & Payments",
    icon: Wallet,
    children: [
      { href: "/admin/payments", label: "Payments", icon: CreditCard, comingSoon: true },
      { href: "/admin/payments/receive", label: "Receive Payment", icon: Wallet, comingSoon: true },
      { href: "/admin/fees/pending", label: "Pending Fees", icon: AlertCircle, comingSoon: true },
      { href: "/admin/payments/receipts", label: "Receipts", icon: Receipt, comingSoon: true },
      { href: "/admin/fees/reports", label: "Fee Reports", icon: BarChart3, comingSoon: true },
    ],
  },
  { label: "Attendance", icon: CalendarCheck, href: "/admin/attendance", comingSoon: true },
  { label: "Classes & Departments", icon: Building2, href: "/admin/classes", comingSoon: true },
  { label: "Parents", icon: UsersRound, href: "/admin/parents", comingSoon: true },
  { label: "Exams & Results", icon: Award, href: "/admin/exams", comingSoon: true },
  { label: "Notices", icon: Megaphone, href: "/admin/notices", comingSoon: true },
  { label: "Documents", icon: FolderKanban, href: "/admin/documents", comingSoon: true },
  { label: "Reports", icon: FileBarChart, href: "/admin/reports", comingSoon: true },
  { label: "Settings", icon: Settings, href: "/admin/settings", comingSoon: true },
];
