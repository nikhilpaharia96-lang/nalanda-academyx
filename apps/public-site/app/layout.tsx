import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { siteConfig as envConfig } from "@/lib/content/site";
import { getSiteContent } from "@/lib/services/siteContentService";
import { SiteContentProvider } from "@/components/providers/SiteContentProvider";

export async function generateMetadata(): Promise<Metadata> {
  const { site } = await getSiteContent();
  return {
    metadataBase: new URL(envConfig.url),
    title: {
      default: `${site.name} | ${site.tagline}`,
      template: `%s | ${site.name}`,
    },
    description: site.description,
    openGraph: { title: site.name, description: site.description, url: envConfig.url, siteName: site.name, type: "website" },
    twitter: { card: "summary_large_image", title: site.name, description: site.description },
  };
}

// Admin-chosen brand colours, applied as CSS variables. Values were validated
// as plain colours by the API; they're re-checked here so nothing but a colour
// can ever reach the <style> tag.
const THEME_VARS: Record<string, string> = {
  navy950: "--color-navy-950", navy900: "--color-navy-900", navy800: "--color-navy-800",
  blue600: "--color-blue-600", blue500: "--color-blue-500",
  gold500: "--color-gold-500", gold400: "--color-gold-400", gold100: "--color-gold-100",
  paper: "--color-paper", ink: "--color-ink",
};
const COLOUR = /^(#[0-9a-fA-F]{3,8}|(rgb|hsl)a?\([0-9.,%\s/]+\))$/;
function themeCss(theme: Record<string, string>) {
  const decls = Object.entries(THEME_VARS)
    .filter(([k]) => typeof theme[k] === "string" && COLOUR.test(theme[k].trim()))
    .map(([k, v]) => `${v}:${theme[k].trim()}`);
  return decls.length ? `:root:root{${decls.join(";")}}` : "";
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const content = await getSiteContent();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "School",
    name: content.site.name,
    description: content.site.description,
    url: envConfig.url,
  };
  const css = themeCss(content.theme);
  return (
    <html lang="en">
      <head>
        {/* Editorial serif, used only for the homepage hero headline — kept
            separate from the site's sans-serif `--font-display` token so
            the rest of the site's typography is untouched. Loaded via a
            plain stylesheet link (not next/font) since it only needs to
            reach the visitor's browser, not this build environment. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,600&family=Great+Vibes&display=swap"
        />
        {css && <style dangerouslySetInnerHTML={{ __html: css }} />}
      </head>
      <body className="font-body antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-navy-950 focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        <SiteContentProvider value={content}>
          <Navbar />
          <main id="main-content">{children}</main>
          <Footer />
        </SiteContentProvider>
      </body>
    </html>
  );
}
