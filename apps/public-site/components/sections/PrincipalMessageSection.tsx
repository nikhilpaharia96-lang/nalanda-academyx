import { Container } from "@/components/ui/Container";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { FadeUp } from "@/components/motion/Reveal";
import { principalMessage } from "@/lib/content/about";
import { Quote } from "lucide-react";

export function PrincipalMessageSection() {
  return (
    <section className="bg-navy-950 py-20 sm:py-28">
      <Container className="grid items-center gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <FadeUp>
          <PlaceholderImage
            label={principalMessage.photoAlt}
            tone="navy"
            className="aspect-[4/5] w-full max-w-sm rounded-[var(--radius-xl)]"
          />
        </FadeUp>
        <FadeUp delay={0.1}>
          <Quote className="h-9 w-9 text-gold-500" strokeWidth={1.5} />
          <p className="mt-6 font-display text-2xl font-medium leading-snug text-white sm:text-3xl">
            {principalMessage.message}
          </p>
          <div className="mt-8">
            <p className="font-display text-lg font-semibold text-white">{principalMessage.name}</p>
            <p className="font-data text-xs uppercase tracking-wider text-gold-400">
              {principalMessage.designation}
            </p>
          </div>
        </FadeUp>
      </Container>
    </section>
  );
}
