import { describe, expect, it } from "vitest";
import { isPublicPath } from "./publicPaths";

describe("isPublicPath", () => {
  it("lets signed-out visitors see the public pages", () => {
    for (const path of ["/", "/privacy", "/terms", "/jobs", "/api/health", "/api/auth/callback/google"]) {
      expect(isPublicPath(path)).toBe(true);
    }
  });

  it("lets a job post and its share image be opened by a link", () => {
    expect(isPublicPath("/jobs/49987144")).toBe(true);
    expect(isPublicPath("/jobs/49987144/opengraph-image")).toBe(true);
  });

  it("keeps everything else behind sign-in", () => {
    for (const path of [
      "/settings",
      "/new",
      "/applications/1",
      "/jobs/abc",
      "/jobs/12/other",
      "/jobs/12/",
      "/api/other",
    ]) {
      expect(isPublicPath(path)).toBe(false);
    }
  });
});
