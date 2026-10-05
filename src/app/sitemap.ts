import type { MetadataRoute } from "next";
import { siteUrl, sitemapFor } from "./seo/site";

// Built per request: the image is built once and the public URL only exists at runtime.
export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  return sitemapFor(siteUrl());
}
