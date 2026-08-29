import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

export function AdmissionCTA() {
  return (
    <section className="relative overflow-hidden bg-navy-950 py-20 sm:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-gold-500/10 blur-[120px]"
      />
      <Container className="relative flex flex-col items-center gap-8 text-center">
        <p className="chapter-mark font-data text-xs font-medium uppercase tracking-[0.3em] text-gold-400">
          Admissions
        </p>
        <h2 className="max-w-xl font-display text-3xl font-semibold leading-tight text-white sm:text-4xl">
          Ready to begin your journey at Nalanda Academy?
        </h2>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button href="/admission" variant="primary" withArrow className="bg-gold-500 text-navy-950 hover:bg-gold-400">
            Apply for Admission
          </Button>
          <Button
            href="/contact"
            variant="secondary"
            className="border-white/25 text-white hover:bg-white hover:text-navy-950"
          >
            Contact the School
          </Button>
        </div>
      </Container>
    </section>
  );
}
