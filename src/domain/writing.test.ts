import { describe, expect, it } from "vitest";
import { findBannedWords, stripEmDashes } from "./writing";

describe("findBannedWords", () => {
  it("finds banned words including inflections", () => {
    expect(findBannedWords("Leveraged a robust queue")).toEqual(["leverage", "robust"]);
  });

  it("ignores clean text", () => {
    expect(findBannedWords("Built a queue in Go")).toEqual([]);
  });
});

describe("stripEmDashes", () => {
  it("replaces spaced and tight em dashes", () => {
    expect(stripEmDashes("Go — fast")).toBe("Go, fast");
    expect(stripEmDashes("event—driven")).toBe("event-driven");
  });
});
