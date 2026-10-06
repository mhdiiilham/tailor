import { describe, expect, it } from "vitest";
import { safeNext } from "./redirect";

describe("safeNext", () => {
  it("keeps a path on this site, with its query", () => {
    expect(safeNext("/new?hn=49934886")).toBe("/new?hn=49934886");
    expect(safeNext("/hiring")).toBe("/hiring");
  });

  it("falls back to home for anything that could leave the site or isn't a path", () => {
    for (const bad of [
      "https://evil.com",
      "//evil.com",
      "/\\evil.com",
      "javascript:alert(1)",
      "hiring",
      "",
      undefined,
      ["/a"],
    ]) {
      expect(safeNext(bad)).toBe("/");
    }
  });
});
