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
    <section className="border-b border-line bg-white">
      <Container className="py-4">
        <StaggerGroup className="grid divide-y divide-line sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
          {items.map(({ title, body, href, Icon }) => (
            <FadeUp as="li" key={title} className="list-none">
              <Link
                href={href}
                className="focus-ring group flex h-full flex-col justify-between gap-6 px-1 py-8 sm:px-6"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-paper text-navy-950 transition-colors group-hover:bg-navy-950 group-hover:text-gold-400">
                    <Icon className="h-5 w-5" />
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-slate-400 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-gold-500" />
                </div>
                <div>
                  <h3 className="font-display text-base font-semibold text-navy-950">{title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{body}</p>
                </div>
              </Link>
            </FadeUp>
          ))}
        </StaggerGroup>
      </Container>
    </section>
  );
}
