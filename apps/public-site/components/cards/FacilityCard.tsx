import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { Badge } from "@/components/ui/Badge";
import type { Facility } from "@/lib/types";

export function FacilityCard({ facility, size = "default" }: { facility: Facility; size?: "default" | "large" }) {
  return (
    <div className="group overflow-hidden rounded-[var(--radius-lg)] border border-line bg-white transition-shadow hover:shadow-[var(--shadow-md)]">
      <div className="relative overflow-hidden">
        <PlaceholderImage
          label={facility.imageQuery}
          className={size === "large" ? "aspect-[16/9] w-full" : "aspect-[4/3] w-full"}
        />
      </div>
      <div className="p-5">
        <Badge>{facility.category}</Badge>
        <h3 className="mt-3 font-display text-lg font-semibold text-navy-950">{facility.name}</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{facility.description}</p>
      </div>
    </div>
  );
}
