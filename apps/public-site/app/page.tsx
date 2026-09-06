import { Hero } from "@/components/hero/Hero";
import { QuickAccess } from "@/components/sections/QuickAccess";
import { AboutSection } from "@/components/sections/AboutSection";
import { AcademicSection } from "@/components/sections/AcademicSection";
import { ResultsSection } from "@/components/sections/ResultsSection";
import { FacilitiesSection } from "@/components/sections/FacilitiesSection";
import { FacultySection } from "@/components/sections/FacultySection";
import { EventsSection } from "@/components/sections/EventsSection";
import { NoticesSection } from "@/components/sections/NoticesSection";
import { AdmissionCTA } from "@/components/sections/AdmissionCTA";
import { ContactPreview } from "@/components/sections/ContactPreview";

export default function HomePage() {
  return (
    <>
      <Hero />
      <QuickAccess />
      <AboutSection />
      <AcademicSection />
      <ResultsSection />
      <FacilitiesSection />
      <FacultySection />
      <EventsSection />
      <NoticesSection />
      <AdmissionCTA />
      <ContactPreview />
    </>
  );
}
