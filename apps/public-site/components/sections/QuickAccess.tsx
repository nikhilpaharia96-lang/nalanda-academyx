import Link from "next/link";
import { GraduationCap, LineChart, Megaphone, CalendarDays, ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { FadeUp, StaggerGroup } from "@/components/motion/Reveal";

const items = [
  { title: "Admissions", body: "Start your application to Nalanda Academy.", href: "/admission", Icon: GraduationCap },
  { title: "Results", body: "View HSLC results by academic year.", href: "/results", Icon: LineChart },
  { title: "Notices", body: "Read the latest official school notices.", href: "/notices", Icon: Megaphone },
  { title: "Events", body: "See what's happening on campus.", href: "/events", Icon: CalendarDays },
];

export function QuickAccess() {
  return (
    // Settles into the page's paper background directly below the hero,
    // with a light lift so it still feels connected to it. Laid out 2-up
    // from the smallest breakpoint (not a tall single-column stack) with
    // tighter padding/type so it stays compact and easy to scan on phones.
    <section className="relative z-10 bg-paper pb-10 pt-8 sm:pb-14 sm:pt-10 lg:pb-16 lg:pt-12">
      <Container>
        <StaggerGroup className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4 lg:gap-4">
          {items.map(({ title, body, href, Icon }) => (
            <FadeUp as="li" key={title} className="list-none">
              <Link
                href={href}
                className="focus-ring group flex h-full flex-col justify-between gap-2.5 rounded-xl border border-line bg-white p-3.5 shadow-[var(--shadow-md)] transition-all hover:-translate-y-0.5 hover:border-gold-400/50 hover:bg-paper hover:shadow-[var(--shadow-lg)] sm:gap-4 sm:rounded-2xl sm:p-5"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-950 text-gold-400 transition-colors group-hover:bg-blue-600 sm:h-10 sm:w-10 sm:rounded-[10px]">
                    <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-gold-500 sm:h-4 sm:w-4" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-semibold leading-snug text-navy-950 sm:text-base">
                    {title}
                  </h3>
                  <p className="mt-0.5 text-xs leading-snug text-slate-600 sm:mt-1 sm:text-sm">{body}</p>
                </div>
              </Link>
            </FadeUp>
          ))}
        </StaggerGroup>
      </Container>
    </section>
  );
}
