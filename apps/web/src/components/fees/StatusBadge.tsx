import { statusBadgeClass, humanize } from "@/lib/fees";

export function StatusBadge({ status }: { status: string | null | undefined }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(status)}`}>
      {humanize(status)}
    </span>
  );
}
