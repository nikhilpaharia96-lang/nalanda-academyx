import type { Metadata } from "next";
import { AcademicSection } from "@/components/sections/AcademicSection";

export const metadata: Metadata = {
  title: "Academics",
  description: "Explore academic programmes and the learning experience at Nalanda Academy.",
};

export default function AcademicsPage() {
  // Leaves room for the fixed navbar (+ desktop info bar), like the site's other page headers.
  return (
    <div className="bg-[#f1f1f1] pt-[72px] lg:pt-[108px]">
      <AcademicSection headingLevel="h1" />
    </div>
  );
}
