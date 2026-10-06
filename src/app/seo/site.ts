import type { Metadata, MetadataRoute } from "next";

export const SITE_NAME = "Tailor";
export const SITE_TITLE = "Tailor: Tailored Resumes for Every Job Description";
export const SITE_DESCRIPTION =
  "Paste a job description, answer a few questions and get a one-page resume PDF built only from your profile. Free, on your own Gemini API key.";

// Public repository. AGPL-3.0 asks a hosted copy to offer its source, so it's linked on every page.
export const SOURCE_URL = "https://github.com/mhdiiilham/tailor";

// The only pages a signed-out visitor (or a crawler) can see.
export const PUBLIC_PAGES = ["/", "/hiring", "/privacy", "/terms"] as const;

// Everything else needs a session, so it's kept out of search results.
const PRIVATE_PATHS = ["/api/", "/applications/", "/new", "/profile", "/settings"];

const FALLBACK_URL = "http://localhost:3000";

// BETTER_AUTH_URL is already required to be the instance's public URL.
export function siteUrl(raw: string | undefined = process.env.BETTER_AUTH_URL): string {
  try {
    return new URL(raw ?? FALLBACK_URL).origin;
  } catch {
    return FALLBACK_URL;
  }
}

export function robotsFor(base: string): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
    sitemap: `${base}/sitemap.xml`,
  };
}

export function sitemapFor(base: string): MetadataRoute.Sitemap {
  return PUBLIC_PAGES.map((path) => ({
    url: `${base}${path === "/" ? "" : path}`,
    changeFrequency: "monthly",
    priority: path === "/" ? 1 : 0.3,
  }));
}

// Next merges openGraph shallowly, so each public page sets its own social title and URL.
// Leaving out the title keeps the layout's default (the full site title).
export function pageMetadata({
  title,
  description,
  path,
}: {
  title?: string;
  description: string;
  path: string;
}): Metadata {
  const socialTitle = title ? `${title} | ${SITE_NAME}` : SITE_TITLE;
  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical: path },
    openGraph: { type: "website", siteName: SITE_NAME, locale: "en_US", title: socialTitle, description, url: path },
    twitter: { card: "summary_large_image", title: socialTitle, description },
  };
}
