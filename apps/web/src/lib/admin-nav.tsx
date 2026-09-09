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
  ShoppingCart,
  PackagePlus,
  Tags,
  ListOrdered,
  Boxes,
  Percent,
  SlidersHorizontal,
  CalendarDays,
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
      { href: "/admin/students/new", label: "Add Student", icon: UserPlus },
      { href: "/admin/admissions", label: "Admissions", icon: ClipboardList, comingSoon: true },
    ],
  },
  {
    label: "Teachers",
    icon: GraduationCap,
    children: [
      { href: "/admin/teachers", label: "All Teachers" },
      { href: "/admin/teachers/new", label: "Add Teacher", icon: UserCog },
    ],
  },
  {
    label: "Fees & Payments",
    icon: Wallet,
    children: [
      { href: "/admin/fees", label: "Fee Structure", icon: FileBarChart },
      { href: "/admin/payments", label: "Payments", icon: CreditCard },
      { href: "/admin/payments/receive", label: "Receive Payment", icon: Wallet },
      { href: "/admin/fees/pending", label: "Pending Fees", icon: AlertCircle },
      { href: "/admin/payments/receipts", label: "Receipts", icon: Receipt },
      { href: "/admin/fees/reports", label: "Fee Reports", icon: BarChart3 },
    ],
  },
  { label: "Attendance", icon: CalendarCheck, href: "/admin/attendance", comingSoon: true },
  { label: "Classes & Departments", icon: Building2, href: "/admin/classes" },
  { label: "Parents", icon: UsersRound, href: "/admin/parents", comingSoon: true },
  { label: "Exams & Results", icon: Award, href: "/admin/exams" },
  {
    label: "School Store",
    icon: ShoppingCart,
    children: [
      { href: "/admin/store", label: "Store Dashboard", icon: LayoutDashboard },
      { href: "/admin/store/products", label: "Products", icon: Boxes },
      { href: "/admin/store/products/new", label: "Add Product", icon: PackagePlus },
      { href: "/admin/store/categories", label: "Categories", icon: Tags },
      { href: "/admin/store/orders", label: "Orders", icon: ListOrdered },
      { href: "/admin/store/inventory", label: "Inventory", icon: Boxes },
      { href: "/admin/store/coupons", label: "Coupons / Discounts", icon: Percent },
      { href: "/admin/store/settings", label: "Store Settings", icon: SlidersHorizontal },
    ],
  },
  {
    label: "Events",
    icon: CalendarDays,
    children: [
      { href: "/admin/events", label: "All Events" },
      { href: "/admin/events/new", label: "Add Event", icon: CalendarDays },
    ],
  },
  {
    label: "Notices",
    icon: Megaphone,
    children: [
      { href: "/admin/notices", label: "All Notices" },
      { href: "/admin/notices/new", label: "Add Notice", icon: Megaphone },
    ],
  },
  { label: "Documents", icon: FolderKanban, href: "/admin/documents", comingSoon: true },
  { label: "Reports", icon: FileBarChart, href: "/admin/reports", comingSoon: true },
  { label: "Settings", icon: Settings, href: "/admin/settings", comingSoon: true },
];
