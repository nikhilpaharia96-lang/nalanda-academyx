import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Paperclip } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { NoticeCard } from "@/components/cards/NoticeCard";
import { formatDate } from "@/lib/utils";
import { getNoticeBySlug, getNotices } from "@/lib/services/noticeService";

interface Params {
  slug: string;
}

export async function generateStaticParams() {
  const notices = await getNotices();
  return notices.map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const notice = await getNoticeBySlug(slug);
  if (!notice) return { title: "Notice" };
  return { title: notice.title, description: notice.content.slice(0, 150) };
}

export default async function NoticeDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const [notice, all] = await Promise.all([getNoticeBySlug(slug), getNotices()]);
  if (!notice) notFound();

  const related = all.filter((n) => n.category === notice.category && n.slug !== notice.slug).slice(0, 3);

  return (
    <article className="pt-[72px]">
      <section className="border-b border-line bg-paper">
        <Container className="py-12 sm:py-16">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Notices", href: "/notices" },
              { label: notice.title },
            ]}
          />
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Badge tone={notice.important ? "gold" : "default"}>{notice.category}</Badge>
            <span className="font-data text-xs uppercase tracking-wider text-slate-400">
              Published {formatDate(notice.publishedDate)}
            </span>
          </div>
          <h1 className="mt-4 max-w-2xl font-display text-3xl font-semibold leading-[1.15] text-navy-950 sm:text-4xl">
            {notice.title}
          </h1>
        </Container>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <Container className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
          <div className="max-w-2xl text-base leading-relaxed text-slate-600">
            <p>{notice.content}</p>

            {notice.attachments && notice.attachments.length > 0 && (
              <div className="mt-8 space-y-2">
                {notice.attachments.map((a) => (
                  <a
                    key={a.href}
                    href={a.href}
                    className="focus-ring flex w-fit items-center gap-2 rounded-[var(--radius-md)] border border-line px-4 py-2.5 text-sm text-navy-950 transition-colors hover:border-navy-950"
                  >
                    <Paperclip className="h-4 w-4 text-gold-500" />
                    {a.label}
                  </a>
                ))}
              </div>
            )}
          </div>

          {related.length > 0 && (
            <div>
              <h2 className="font-display text-base font-semibold text-navy-950">Related Notices</h2>
              <div className="mt-4 divide-y divide-line rounded-[var(--radius-lg)] border border-line">
                {related.map((n) => (
                  <NoticeCard key={n.slug} notice={n} />
                ))}
              </div>
            </div>
          )}
        </Container>
      </section>
    </article>
  );
}
