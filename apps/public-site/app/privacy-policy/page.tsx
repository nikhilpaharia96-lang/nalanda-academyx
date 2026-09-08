import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/hero/PageHero";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Nalanda Academy's privacy policy.",
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Privacy Policy"
        description="Demo placeholder — replace with the school's official, legally reviewed privacy policy before publishing."
        crumbs={[{ label: "Home", href: "/" }, { label: "Privacy Policy" }]}
      />

      <section className="bg-white py-16 sm:py-24">
        <Container className="max-w-2xl">
          <p className="text-sm leading-relaxed text-slate-600">
            [Official privacy policy content to be added]
          </p>
        </Container>
      </section>
    </>
  );
}
