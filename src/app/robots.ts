import type { MetadataRoute } from "next";
import { robotsFor, siteUrl } from "./seo/site";

// Built per request: the image is built once and the public URL only exists at runtime.
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return robotsFor(siteUrl());
}
