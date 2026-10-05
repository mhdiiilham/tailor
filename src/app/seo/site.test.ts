import { describe, expect, it } from "vitest";
import { PUBLIC_PAGES, SITE_NAME, pageMetadata, robotsFor, siteUrl, sitemapFor } from "./site";

describe("siteUrl", () => {
  it("uses the public URL without a trailing slash", () => {
    expect(siteUrl("https://tailor.example.com/")).toBe("https://tailor.example.com");
  });

  it("falls back to localhost when unset or invalid", () => {
    expect(siteUrl(undefined)).toBe("http://localhost:3000");
    expect(siteUrl("not a url")).toBe("http://localhost:3000");
  });
});

describe("robotsFor", () => {
  const robots = robotsFor("https://tailor.example.com");

  it("allows the public pages and keeps signed-in pages out", () => {
    const rule = Array.isArray(robots.rules) ? robots.rules[0] : robots.rules;
    expect(rule.allow).toBe("/");
    expect(rule.disallow).toEqual(expect.arrayContaining(["/api/", "/applications/", "/settings"]));
  });

  it("points at the sitemap", () => {
    expect(robots.sitemap).toBe("https://tailor.example.com/sitemap.xml");
  });
});

describe("sitemapFor", () => {
  it("lists only the public pages, as absolute URLs", () => {
    expect(sitemapFor("https://tailor.example.com").map((e) => e.url)).toEqual(
      PUBLIC_PAGES.map((p) => `https://tailor.example.com${p === "/" ? "" : p}`),
    );
  });
});

describe("pageMetadata", () => {
  const meta = pageMetadata({ title: "Privacy Policy", description: "What is stored.", path: "/privacy" });

  it("gives the page its own canonical and social title", () => {
    expect(meta.alternates?.canonical).toBe("/privacy");
    expect(meta.openGraph).toMatchObject({
      title: "Privacy Policy | Tailor",
      description: "What is stored.",
      url: "/privacy",
      siteName: SITE_NAME,
      type: "website",
    });
    expect(meta.twitter).toMatchObject({ card: "summary_large_image", title: "Privacy Policy | Tailor" });
  });

  it("keeps the full site title on the home page", () => {
    const home = pageMetadata({ description: "Home.", path: "/" });
    expect(home.title).toBeUndefined();
    expect(home.openGraph?.title).toBe("Tailor: Tailored Resumes for Every Job Description");
  });
});
