import type { Metadata } from "next";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/hero/PageHero";
import { ContactForm } from "@/components/sections/ContactForm";
import { contactInfo } from "@/lib/content/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Nalanda Academy.",
};

const rows = [
  { label: "Address", value: contactInfo.address, Icon: MapPin },
  { label: "Phone", value: contactInfo.phone, Icon: Phone },
  { label: "Email", value: contactInfo.email, Icon: Mail },
  { label: "Office Hours", value: contactInfo.officeHours, Icon: Clock },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Get in touch with Nalanda Academy."
        description="Reach out with any question about admissions, academics or campus life."
        crumbs={[{ label: "Home", href: "/" }, { label: "Contact" }]}
      />

      <section className="bg-white py-16 sm:py-24">
        <Container className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {rows.map(({ label, value, Icon }) => (
                <div key={label} className="rounded-[var(--radius-lg)] border border-line bg-paper p-5">
                  <Icon className="h-4 w-4 text-gold-500" />
                  <p className="mt-3 font-data text-[11px] uppercase tracking-wider text-slate-400">{label}</p>
                  <p className="mt-1 text-sm text-navy-950">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 overflow-hidden rounded-[var(--radius-lg)] border border-line">
              {contactInfo.mapEmbedUrl ? (
                <iframe
                  title="Nalanda Academy location"
                  src={contactInfo.mapEmbedUrl}
                  className="h-64 w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : (
                <div className="flex h-64 w-full flex-col items-center justify-center gap-2 bg-paper-deep text-center text-slate-400">
                  <MapPin className="h-6 w-6" />
                  <p className="max-w-[70%] font-data text-[11px] uppercase tracking-wider">
                    Map placeholder — configure NEXT_PUBLIC_GOOGLE_MAPS_URL
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[var(--radius-xl)] border border-line bg-paper p-6 sm:p-10">
            <h2 className="font-display text-xl font-semibold text-navy-950">Send us a message</h2>
            <div className="mt-6">
              <ContactForm />
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
