import type { Metadata } from "next";
import { AboutPageSection } from "@/components/sections/AboutPageSection";

export const metadata: Metadata = {
  title: "About",
  description: "Learn about Nalanda Academy's vision, mission and the Chairperson's message.",
};

export default function AboutPage() {
  return (
    // Leaves room for the fixed navbar (+ desktop info bar), like the site's other pages.
    <div className="bg-[#f1f1f1] pt-[72px] lg:pt-[108px]">
      <AboutPageSection headingLevel="h1" />
    </div>
  );
}
