// Shared display helpers for the Fees & Payments admin/student pages.

export const FEE_TYPES = [
  "ADMISSION_FEE",
  "MONTHLY_FEE",
  "ANNUAL_FEE",
  "EXAMINATION_FEE",
  "REGISTRATION_FEE",
  "DEVELOPMENT_FEE",
  "LIBRARY_FEE",
  "TRANSPORT_FEE",
  "OTHER",
] as const;

export const FEE_FREQUENCIES = ["ONE_TIME", "MONTHLY", "QUARTERLY", "HALF_YEARLY", "YEARLY"] as const;

export const OFFLINE_METHODS: { value: string; label: string }[] = [
  { value: "OFFLINE_CASH", label: "Cash" },
  { value: "OFFLINE_UPI", label: "UPI" },
  { value: "OFFLINE_BANK_TRANSFER", label: "Bank Transfer" },
  { value: "OFFLINE_CHEQUE", label: "Cheque" },
  { value: "OFFLINE_OTHER", label: "Other" },
];

export function humanize(value: string | null | undefined): string {
  if (!value) return "—";
  return value
    .replace(/^OFFLINE_/, "")
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "—";
  return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return value;
  }
}

const STATUS_STYLES: Record<string, string> = {
  PAID: "bg-emerald-50 text-emerald-700",
  PENDING: "bg-amber-50 text-amber-700",
  PARTIALLY_PAID: "bg-blue-50 text-blue-700",
  OVERDUE: "bg-red-50 text-red-700",
  FAILED: "bg-red-50 text-red-700",
  CANCELLED: "bg-neutral-100 text-neutral-600",
  WAIVED: "bg-purple-50 text-purple-700",
  PROCESSING: "bg-amber-50 text-amber-700",
};

export function statusBadgeClass(status: string | null | undefined): string {
  if (!status) return "bg-neutral-100 text-neutral-600";
  return STATUS_STYLES[status] ?? "bg-neutral-100 text-neutral-600";
}
