import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/content/site";
import { getResultYears } from "@/lib/services/resultService";
import { getEvents } from "@/lib/services/eventService";
import { getNotices } from "@/lib/services/noticeService";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "",
    "/about",
    "/academics",
    "/facilities",
    "/faculty",
    "/results",
    "/events",
    "/notices",
    "/admission",
    "/contact",
  ].map((route) => ({
    url: `${siteConfig.url}${route}`,
    lastModified: new Date(),
  }));

  const [years, events, notices] = await Promise.all([getResultYears(), getEvents(), getNotices()]);

  const resultRoutes = years.map((y) => ({
    url: `${siteConfig.url}/results/${y.year}`,
    lastModified: new Date(),
  }));
  const eventRoutes = events.map((e) => ({
    url: `${siteConfig.url}/events/${e.slug}`,
    lastModified: new Date(e.date),
  }));
  const noticeRoutes = notices.map((n) => ({
    url: `${siteConfig.url}/notices/${n.slug}`,
    lastModified: new Date(n.publishedDate),
  }));

  return [...staticRoutes, ...resultRoutes, ...eventRoutes, ...noticeRoutes];
}
