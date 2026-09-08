import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/hero/PageHero";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "Nalanda Academy's refund policy.",
};

export default function RefundPolicyPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Refund Policy"
        description="Demo placeholder — replace with the school's official, legally reviewed refund policy before publishing."
        crumbs={[{ label: "Home", href: "/" }, { label: "Refund Policy" }]}
      />

      <section className="bg-white py-16 sm:py-24">
        <Container className="max-w-2xl">
          <p className="text-sm leading-relaxed text-slate-600">
            [Official refund policy content to be added]
          </p>
        </Container>
      </section>
    </>
  );
}
