import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <section className="flex min-h-screen flex-col items-center justify-center bg-navy-950 pt-[72px] text-center">
      <Container className="flex flex-col items-center py-20">
        <span className="font-data text-xs uppercase tracking-[0.3em] text-gold-400">404</span>
        <h1 className="mt-4 max-w-md font-display text-3xl font-semibold text-white sm:text-4xl">
          This page could not be found.
        </h1>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button href="/" variant="primary" className="bg-gold-500 text-navy-950 hover:bg-gold-400">
            Back Home
          </Button>
          <Button href="/about" variant="secondary" className="border-white/25 text-white hover:bg-white hover:text-navy-950">
            Explore Academy
          </Button>
        </div>
      </Container>
    </section>
  );
}
