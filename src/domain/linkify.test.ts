import { describe, expect, it } from "vitest";
import { splitLinks } from "./linkify";

describe("splitLinks", () => {
  it("splits text into plain parts and web links, leaving trailing punctuation out of the link", () => {
    expect(splitLinks("Apply at https://acme.com/jobs. Or (https://acme.com/x), thanks")).toEqual([
      { text: "Apply at " },
      { text: "https://acme.com/jobs", href: "https://acme.com/jobs" },
      { text: ". Or (" },
      { text: "https://acme.com/x", href: "https://acme.com/x" },
      { text: "), thanks" },
    ]);
  });

  it("never links anything but http(s)", () => {
    expect(splitLinks("javascript:alert(1) and ftp://x")).toEqual([{ text: "javascript:alert(1) and ftp://x" }]);
  });
});
