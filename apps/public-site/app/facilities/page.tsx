import type { Metadata } from "next";
import { FacilitiesSection } from "@/components/sections/FacilitiesSection";

export const metadata: Metadata = {
  title: "Facilities",
  description: "Explore the campus and facilities of Nalanda Academy.",
};

export default function FacilitiesPage() {
  return (
    // Leaves room for the fixed navbar (+ desktop info bar).
    <div className="bg-white pt-[72px] lg:pt-[108px]">
      <FacilitiesSection />
    </div>
  );
}
