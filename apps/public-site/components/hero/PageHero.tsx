import { Container } from "@/components/ui/Container";
import { Breadcrumbs, type Crumb } from "@/components/ui/Breadcrumbs";

export function PageHero({
  eyebrow,
  title,
  description,
  crumbs,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  crumbs: Crumb[];
}) {
  return (
    <section className="border-b border-line bg-paper pt-[72px] lg:pt-[108px]">
      <Container className="py-8 sm:py-16">
        <Breadcrumbs items={crumbs} />
        <p className="chapter-mark mt-5 font-data sm:mt-8 text-xs font-medium uppercase tracking-[0.3em] text-gold-500">
          {eyebrow}
        </p>
        <h1 className="mt-3 max-w-2xl font-display text-[2rem] sm:mt-4 font-semibold leading-[1.08] text-navy-950 sm:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="mt-4 max-w-xl text-[15px] sm:mt-5 sm:text-base leading-relaxed text-slate-600">{description}</p>
        )}
      </Container>
    </section>
  );
}
