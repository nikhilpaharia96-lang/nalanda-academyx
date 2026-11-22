import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/hero/PageHero";
import { NoticesBrowser } from "@/components/sections/NoticesBrowser";
import { getNotices } from "@/lib/services/noticeService";
import { noticeCategories } from "@/lib/content/notices";

export const metadata: Metadata = {
  title: "Notices",
  description: "Official notices and announcements from Nalanda Academy.",
};

export default async function NoticesPage() {
  const notices = await getNotices();

  return (
    <>
      <PageHero
        eyebrow="Notice Board"
        title="Announcements from the school office."
        description="Search and filter official notices covering admissions, examinations, results, holidays and events."
        crumbs={[{ label: "Home", href: "/" }, { label: "Notices" }]}
      />
      <section className="bg-white py-10 sm:py-16 lg:py-24">
        <Container>
          <NoticesBrowser notices={notices} categories={noticeCategories} />
        </Container>
      </section>
    </>
  );
}
