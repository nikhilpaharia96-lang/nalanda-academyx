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
import { getSiteContent } from "@/lib/services/siteContentService";
import type { HomepageSectionId } from "@/lib/content/siteContent";

const BLOCKS: Record<HomepageSectionId, () => React.ReactNode> = {
  hero: () => <Hero />,
  quickAccess: () => <QuickAccess />,
  about: () => <AboutSection />,
  academics: () => <AcademicSection />,
  results: () => <ResultsSection />,
  facilities: () => <FacilitiesSection />,
  faculty: () => <FacultySection />,
  events: () => <EventsSection />,
  notices: () => <NoticesSection />,
  admission: () => <AdmissionCTA />,
  contact: () => <ContactPreview />,
};

// Which homepage blocks show, and in what order, is set under
// Admin → Website Content → Homepage layout.
export default async function HomePage() {
  const { homepage } = await getSiteContent();
  return (
    <>
      {homepage.sections
        .filter((s) => s.visible && s.id in BLOCKS)
        .map((s) => (
          <div key={s.id} style={{ display: "contents" }}>
            {BLOCKS[s.id as HomepageSectionId]()}
          </div>
        ))}
    </>
  );
}
