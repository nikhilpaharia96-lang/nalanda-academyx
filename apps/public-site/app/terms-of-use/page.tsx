import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/hero/PageHero";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Nalanda Academy's terms of use.",
};

export default function TermsOfUsePage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Terms of Use"
        description="Demo placeholder — replace with the school's official, legally reviewed terms of use before publishing."
        crumbs={[{ label: "Home", href: "/" }, { label: "Terms of Use" }]}
      />

      <section className="bg-white py-16 sm:py-24">
        <Container className="max-w-2xl">
          <p className="text-sm leading-relaxed text-slate-600">
            [Official terms of use content to be added]
          </p>
        </Container>
      </section>
    </>
  );
}
