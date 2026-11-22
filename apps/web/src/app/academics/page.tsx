import type { Metadata } from "next";
import Image from "next/image";
import { Oswald } from "next/font/google";
import {
  BookOpen,
  Building2,
  FileText,
  FlaskConical,
  GraduationCap,
  Laptop,
  Library,
  Lightbulb,
  Target,
  TrendingUp,
  Trophy,
  User,
  UserRound,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Academics | Nalanda Academy",
  description: "Where Learning Meets Possibility — academic programs, learning approach and support at Nalanda Academy.",
};

const oswald = Oswald({ subsets: ["latin"], weight: ["600"], display: "swap", fallback: ["Arial Narrow", "Impact", "sans-serif"] });

type Icon = LucideIcon;

const NAVY = "#031634";
const NAVY_DEEP = "#001530";
const GOLD = "#B8841F";
const GOLD_LIGHT = "#E6B94F";

const HIGHLIGHTS: { icon: Icon; title: string; text: string }[] = [
  { icon: GraduationCap, title: "Concept-Driven Learning", text: "Understanding over rote memorization." },
  { icon: Lightbulb, title: "Future-Ready Skills", text: "Critical thinking, creativity & innovation." },
  { icon: Target, title: "Academic Excellence", text: "Guided preparation for a brighter future." },
];

const PROGRAMS: { icon: Icon; title: string; tagline: string; text: string; grades: string }[] = [
  { icon: BookOpen, title: "SCHOOL PROGRAM", tagline: "Foundations for Lifelong Learning", text: "A strong academic foundation for primary and secondary students with focus on concepts, values and curiosity.", grades: "Grades: I – X" },
  { icon: User, title: "SENIOR SECONDARY", tagline: "Prepare. Perform. Progress.", text: "Science, Commerce and Humanities streams designed to prepare students for higher education and beyond.", grades: "Grades: XI – XII" },
  { icon: GraduationCap, title: "COMPETITIVE PREPARATION", tagline: "Aim Higher. Achieve More.", text: "Specialized guidance for competitive exams like JEE, NEET, CUET and other entrance tests.", grades: "Grades: XI – XII & Passouts" },
  { icon: Laptop, title: "SKILL & PERSONAL DEVELOPMENT", tagline: "Beyond Books, For Life.", text: "Programs that build communication, leadership, technology, and life skills for holistic growth.", grades: "All Grades" },
];

const APPROACH: { icon: Icon; title: string; text: string }[] = [
  { icon: UsersRound, title: "Student-Centered Learning", text: "Personalized attention for every learner." },
  { icon: BookOpen, title: "Interactive Classrooms", text: "Engaging lessons, real-world connections." },
  { icon: FlaskConical, title: "Practical Exposure", text: "Labs, projects & activities that build understanding." },
  { icon: TrendingUp, title: "Continuous Assessment", text: "Regular feedback to track and improve." },
];

const SUPPORT: { icon: Icon; title: string; text: string }[] = [
  { icon: UserRound, title: "Experienced Faculty", text: "Mentors who inspire and guide." },
  { icon: Library, title: "Study Resources", text: "Well-equipped library and digital resources." },
  { icon: FileText, title: "Remedial & Enrichment", text: "Extra support to help every student succeed." },
  { icon: Users, title: "Parent Collaboration", text: "Together, we support every child's journey." },
];

const STATS: { icon: Icon; value: string; label: string }[] = [
  { icon: GraduationCap, value: "1000+", label: "Students" },
  { icon: UserRound, value: "50+", label: "Expert Faculty" },
  { icon: BookOpen, value: "25+", label: "Subjects Offered" },
  { icon: Trophy, value: "95%", label: "Success Rate" },
];

/* Desktop canvas helpers: positions are taken from the 1536 x 930 design and
 * converted to percentages / container-query units so it scales 1:1. */
const px = (v: number) => `${(v / 1536) * 100}%`;
const py = (v: number) => `${(v / 930) * 100}%`;
const fs = (v: number) => `${(v / 1536) * 100}cqw`;
const rect = (x: number, y: number, w: number, h: number): React.CSSProperties => ({
  position: "absolute",
  left: px(x),
  top: py(y),
  width: px(w),
  height: py(h),
});

function GoldCircle({ icon: Ico, size, className = "" }: { icon: Icon; size: number; className?: string }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full border-2 ${className}`}
      style={{ width: fs(size), height: fs(size), borderColor: GOLD_LIGHT, color: GOLD_LIGHT }}
    >
      <Ico className="h-1/2 w-1/2" strokeWidth={1.5} />
    </span>
  );
}

export default function AcademicsPage() {
  return (
    <main className="bg-[#f1f1f1]">
      {/* ------------------------- Desktop: exact 1536 x 930 canvas ------------------------- */}
      <div className="hidden xl:block">
        <div
          className="relative mx-auto w-full max-w-[1536px] overflow-hidden bg-[#f1f1f1]"
          style={{ aspectRatio: "1536 / 930", containerType: "inline-size" }}
        >
          {/* top navy line */}
          <div style={rect(0, 0, 1536, 4)} className="bg-[#0B1F3A]" />

          {/* HERO ---------------------------------------------------------------- */}
          <div style={rect(1288, 4, 248, 368)} className="overflow-hidden">
            <Image src="/images/academics/hero-classroom.jpg" alt="" fill sizes="20vw" className="scale-150 object-cover object-right blur-md brightness-75" aria-hidden="true" />
          </div>
          <div style={rect(545, 4, 743, 368)}>
            <Image src="/images/academics/hero-classroom.jpg" alt="Students studying in a Nalanda Academy classroom" fill priority sizes="50vw" className="object-cover" />
          </div>

          <h1 className={`${oswald.className} absolute uppercase leading-none text-[#0B1F3A]`} style={{ left: px(68), top: py(52), fontSize: fs(82), letterSpacing: "0.01em" }}>
            Academics
          </h1>
          <p className="absolute font-serif" style={{ left: px(68), top: py(134), fontSize: fs(25), color: GOLD }}>
            Where Learning Meets Possibility
          </p>
          <div style={{ ...rect(68, 182, 66, 2), backgroundColor: GOLD }} />
          <p className="absolute text-[#222]" style={{ left: px(68), top: py(205), width: px(480), fontSize: fs(16), lineHeight: 1.65 }}>
            At Nalanda Academy, academics go beyond textbooks. We empower students with deep understanding, critical thinking, and real-world skills to help them excel in every stage of life.
          </p>

          {/* highlight card */}
          <div style={{ ...rect(1290, 32, 213, 325), backgroundColor: "#06142c", borderColor: GOLD, borderWidth: 2, borderStyle: "solid", borderRadius: fs(12) }}>
            {HIGHLIGHTS.map((h, i) => (
              <div
                key={h.title}
                className="absolute flex items-center"
                style={{ left: 0, right: 0, top: `${i * 33.3}%`, height: "33.3%", paddingLeft: fs(18), paddingRight: fs(10), gap: fs(14), borderTop: i ? `1px solid ${GOLD}` : undefined }}
              >
                <GoldCircle icon={h.icon} size={52} />
                <div className="min-w-0 text-white">
                  <p className="font-bold leading-tight" style={{ fontSize: fs(14.5) }}>{h.title}</p>
                  <p className="mt-1 leading-snug text-neutral-300" style={{ fontSize: fs(10.5) }}>{h.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* PROGRAMS ------------------------------------------------------------- */}
          <div className="absolute flex items-center justify-center" style={{ left: 0, right: 0, top: py(388), height: py(26), gap: fs(24) }}>
            <span style={{ width: fs(155), height: 1, background: `linear-gradient(to right, transparent, ${GOLD})` }} />
            <h2 className="font-bold tracking-wide text-[#0B1F3A]" style={{ fontSize: fs(19) }}>OUR ACADEMIC PROGRAMS</h2>
            <span style={{ width: fs(155), height: 1, background: `linear-gradient(to left, transparent, ${GOLD})` }} />
          </div>

          {[
            { x: 126, w: 297 },
            { x: 444, w: 304 },
            { x: 769, w: 308 },
            { x: 1098, w: 310 },
          ].map((pos, i) => {
            const p = PROGRAMS[i];
            return (
              <div key={p.title} style={rect(pos.x, 428, pos.w, 153)} className="flex overflow-hidden rounded-md border border-slate-200 bg-white shadow-md">
                <div className="flex shrink-0 items-start justify-center" style={{ width: fs(76), backgroundColor: NAVY, paddingTop: fs(16) }}>
                  <GoldCircle icon={p.icon} size={54} />
                </div>
                <div className="flex min-w-0 flex-1 flex-col" style={{ padding: `${fs(14)} ${fs(14)} ${fs(10)} ${fs(16)}` }}>
                  <h3 className="font-bold leading-tight text-[#0B1F3A]" style={{ fontSize: fs(14.5) }}>{p.title}</h3>
                  <p className="font-medium" style={{ fontSize: fs(11.5), color: GOLD, marginTop: fs(4) }}>{p.tagline}</p>
                  <p className="leading-snug text-slate-600" style={{ fontSize: fs(10), marginTop: fs(8) }}>{p.text}</p>
                  <p className="mt-auto font-bold text-[#0B1F3A]" style={{ fontSize: fs(12), borderTop: `1px solid ${GOLD}55`, paddingTop: fs(6) }}>{p.grades}</p>
                </div>
              </div>
            );
          })}

          {/* LEARNING APPROACH ----------------------------------------------------- */}
          <div style={{ ...rect(69, 603, 491, 196), backgroundColor: NAVY, borderRadius: fs(8) }}>
            <div className="absolute flex items-center" style={{ left: fs(27), right: fs(27), top: fs(14), gap: fs(12) }}>
              <h2 className="whitespace-nowrap font-bold" style={{ fontSize: fs(17), color: GOLD_LIGHT }}>OUR LEARNING APPROACH</h2>
              <span className="flex-1" style={{ height: 1, background: `linear-gradient(to right, ${GOLD}, transparent)` }} />
            </div>
            <div className="absolute grid grid-cols-4" style={{ left: fs(6), right: fs(6), top: fs(50), bottom: fs(8) }}>
              {APPROACH.map((a, i) => (
                <div key={a.title} className="flex flex-col items-center text-center text-white" style={{ padding: `0 ${fs(6)}`, borderLeft: i ? "1px solid rgba(255,255,255,.18)" : undefined }}>
                  <a.icon className="text-white" strokeWidth={1.4} style={{ width: fs(36), height: fs(36) }} />
                  <p className="font-semibold leading-tight" style={{ fontSize: fs(11.5), marginTop: fs(8) }}>{a.title}</p>
                  <p className="leading-snug text-neutral-300" style={{ fontSize: fs(9.5), marginTop: fs(6) }}>{a.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={rect(572, 603, 371, 196)} className="overflow-hidden rounded-md shadow-md">
            <Image src="/images/academics/teacher-group.jpg" alt="Teacher guiding students" fill sizes="25vw" className="object-cover" />
          </div>

          {/* ACADEMIC SUPPORT ------------------------------------------------------- */}
          <div style={{ ...rect(953, 603, 514, 196), backgroundColor: "#e9eef9", borderRadius: fs(8) }}>
            <h2 className="absolute text-center font-bold text-[#0B1F3A]" style={{ left: 0, width: fs(400), top: fs(14), fontSize: fs(17) }}>ACADEMIC SUPPORT</h2>
            <div className="absolute grid grid-cols-4" style={{ left: fs(8), right: fs(8), top: fs(40), bottom: fs(8) }}>
              {SUPPORT.map((s, i) => (
                <div key={s.title} className="flex flex-col items-center text-center" style={{ padding: `0 ${fs(8)}`, borderLeft: i ? "1px solid rgba(11,31,58,.2)" : undefined }}>
                  <span className="flex items-center justify-center rounded-full" style={{ width: fs(60), height: fs(60), backgroundColor: NAVY, color: GOLD_LIGHT }}>
                    <s.icon className="h-1/2 w-1/2" strokeWidth={1.5} />
                  </span>
                  <p className="font-semibold leading-tight text-[#0B1F3A]" style={{ fontSize: fs(12), marginTop: fs(8) }}>{s.title}</p>
                  <p className="leading-snug text-slate-600" style={{ fontSize: fs(9.5), marginTop: fs(4) }}>{s.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* FOOTER BAR ------------------------------------------------------------- */}
          <div style={{ ...rect(0, 818, 1536, 112), backgroundColor: NAVY_DEEP }} className="text-white">
            <div className="absolute" style={{ left: fs(66), top: fs(20), width: fs(350) }}>
              <p className="font-serif italic leading-snug" style={{ fontSize: fs(19), paddingLeft: fs(34) }}>
                <span className="absolute font-serif not-italic" style={{ left: 0, top: fs(-6), fontSize: fs(44), color: GOLD_LIGHT }}>“</span>
                Education is the most powerful weapon which you can use to change the world.
              </p>
              <p className="text-right font-medium" style={{ fontSize: fs(15), color: GOLD_LIGHT, marginTop: fs(6) }}>– Nelson Mandela</p>
            </div>
            {[479, 653, 837, 1030].map((x, i) => {
              const s = STATS[i];
              return (
                <div key={s.label} className="absolute flex items-center" style={{ left: px(x), top: fs(26), gap: fs(14) }}>
                  <GoldCircle icon={s.icon} size={54} />
                  <div>
                    <p className="font-bold leading-none" style={{ fontSize: fs(23) }}>{s.value}</p>
                    <p className="text-neutral-200" style={{ fontSize: fs(12), marginTop: fs(4) }}>{s.label}</p>
                  </div>
                </div>
              );
            })}
            {[631, 812, 1010, 1180].map((x) => (
              <span key={x} className="absolute bg-white/20" style={{ left: px(x), top: fs(22), width: 1, height: fs(68) }} />
            ))}
            <Building2 className="absolute" strokeWidth={1.3} style={{ left: px(1198), top: fs(12), width: fs(70), height: fs(70), color: GOLD_LIGHT }} />
            <p className="absolute font-medium leading-snug" style={{ left: px(1287), top: fs(24), fontSize: fs(17) }}>
              Knowledge Today.
              <br />
              Leadership Tomorrow.
              <br />
              <span style={{ color: GOLD_LIGHT }}>A Better World Always.</span>
            </p>
          </div>
        </div>
      </div>

      {/* ----------------------------- Tablet / mobile layout ----------------------------- */}
      <div className="xl:hidden">
        <section className="relative overflow-hidden bg-[#f1f1f1]">
          <div className="relative h-56 sm:h-72">
            <Image src="/images/academics/hero-classroom.jpg" alt="Students studying in a Nalanda Academy classroom" fill priority sizes="100vw" className="object-cover object-right" />
          </div>
          <div className="px-5 py-6 sm:px-8">
            <h1 className={`${oswald.className} text-5xl uppercase leading-none text-[#0B1F3A] sm:text-6xl`}>Academics</h1>
            <p className="mt-2 font-serif text-xl" style={{ color: GOLD }}>Where Learning Meets Possibility</p>
            <div className="my-3 h-0.5 w-16" style={{ backgroundColor: GOLD }} />
            <p className="max-w-xl leading-relaxed text-slate-800">
              At Nalanda Academy, academics go beyond textbooks. We empower students with deep understanding, critical thinking, and real-world skills to help them excel in every stage of life.
            </p>
          </div>
          <div className="mx-5 mb-6 divide-y rounded-xl border-2 p-2 sm:mx-8" style={{ backgroundColor: "#06142c", borderColor: GOLD }}>
            {HIGHLIGHTS.map((h) => (
              <div key={h.title} className="flex items-center gap-4 p-3 text-white" style={{ borderColor: `${GOLD}88` }}>
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2" style={{ borderColor: GOLD_LIGHT, color: GOLD_LIGHT }}>
                  <h.icon className="h-6 w-6" strokeWidth={1.5} />
                </span>
                <div>
                  <p className="font-bold">{h.title}</p>
                  <p className="text-sm text-neutral-300">{h.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="px-5 pb-8 sm:px-8">
          <h2 className="mb-4 text-center text-lg font-bold tracking-wide text-[#0B1F3A]">OUR ACADEMIC PROGRAMS</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {PROGRAMS.map((p) => (
              <div key={p.title} className="flex overflow-hidden rounded-md border border-slate-200 bg-white shadow-md">
                <div className="flex w-16 shrink-0 items-start justify-center pt-4" style={{ backgroundColor: NAVY }}>
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border-2" style={{ borderColor: GOLD_LIGHT, color: GOLD_LIGHT }}>
                    <p.icon className="h-5 w-5" strokeWidth={1.5} />
                  </span>
                </div>
                <div className="flex-1 p-4">
                  <h3 className="font-bold text-[#0B1F3A]">{p.title}</h3>
                  <p className="text-sm font-medium" style={{ color: GOLD }}>{p.tagline}</p>
                  <p className="mt-2 text-sm text-slate-600">{p.text}</p>
                  <p className="mt-3 border-t pt-2 text-sm font-bold text-[#0B1F3A]" style={{ borderColor: `${GOLD}55` }}>{p.grades}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 px-5 pb-8 sm:px-8 lg:grid-cols-2">
          <div className="rounded-lg p-5 text-white" style={{ backgroundColor: NAVY }}>
            <h2 className="mb-4 font-bold" style={{ color: GOLD_LIGHT }}>OUR LEARNING APPROACH</h2>
            <div className="grid grid-cols-2 gap-4 text-center">
              {APPROACH.map((a) => (
                <div key={a.title} className="flex flex-col items-center">
                  <a.icon className="h-8 w-8" strokeWidth={1.4} />
                  <p className="mt-2 text-sm font-semibold">{a.title}</p>
                  <p className="text-xs text-neutral-300">{a.text}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative min-h-56 overflow-hidden rounded-lg shadow-md">
            <Image src="/images/academics/teacher-group.jpg" alt="Teacher guiding students" fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
          </div>
          <div className="rounded-lg bg-[#e9eef9] p-5 lg:col-span-2">
            <h2 className="mb-4 text-center font-bold text-[#0B1F3A]">ACADEMIC SUPPORT</h2>
            <div className="grid grid-cols-2 gap-4 text-center lg:grid-cols-4">
              {SUPPORT.map((s) => (
                <div key={s.title} className="flex flex-col items-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: NAVY, color: GOLD_LIGHT }}>
                    <s.icon className="h-7 w-7" strokeWidth={1.5} />
                  </span>
                  <p className="mt-2 text-sm font-semibold text-[#0B1F3A]">{s.title}</p>
                  <p className="text-xs text-slate-600">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="px-5 py-8 text-white sm:px-8" style={{ backgroundColor: NAVY_DEEP }}>
          <p className="font-serif text-lg italic">“Education is the most powerful weapon which you can use to change the world.”</p>
          <p className="mt-1 text-right font-medium" style={{ color: GOLD_LIGHT }}>– Nelson Mandela</p>
          <div className="my-6 grid grid-cols-2 gap-5 sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2" style={{ borderColor: GOLD_LIGHT, color: GOLD_LIGHT }}>
                  <s.icon className="h-6 w-6" strokeWidth={1.5} />
                </span>
                <div>
                  <p className="text-xl font-bold leading-none">{s.value}</p>
                  <p className="text-xs text-neutral-200">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 border-t border-white/15 pt-5">
            <Building2 className="h-12 w-12 shrink-0" strokeWidth={1.3} style={{ color: GOLD_LIGHT }} />
            <p className="font-medium leading-snug">
              Knowledge Today. Leadership Tomorrow. <span style={{ color: GOLD_LIGHT }}>A Better World Always.</span>
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}
