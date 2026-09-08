import { FacultyPhoto } from "@/components/ui/FacultyPhoto";
import type { FacultyMember } from "@/lib/types";

export function FacultyCard({ member }: { member: FacultyMember }) {
  return (
    <div className="group overflow-hidden rounded-[var(--radius-lg)] border border-line bg-white transition-shadow hover:shadow-[var(--shadow-md)]">
      <FacultyPhoto
        photoUrl={member.photoUrl}
        photoAlt={member.photoAlt}
        isDemo={member.isDemo}
        className="aspect-[4/5] w-full"
      />
      <div className="p-5">
        <h3 className="font-display text-base font-semibold text-navy-950">{member.name}</h3>
        <p className="mt-1 text-sm text-slate-600">{member.designation}</p>
        <p className="mt-2 font-data text-[11px] uppercase tracking-wider text-gold-500">
          {member.subject}
        </p>
      </div>
    </div>
  );
}
