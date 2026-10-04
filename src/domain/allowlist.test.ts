import { describe, expect, it } from "vitest";
import { isAllowed, parseAllowlist } from "./allowlist";

describe("parseAllowlist", () => {
  it("splits, trims, lowercases and drops blanks", () => {
    expect(parseAllowlist(" Me@Example.com, ,friend@example.com ")).toEqual(["me@example.com", "friend@example.com"]);
  });

  it("is empty when unset", () => {
    expect(parseAllowlist(undefined)).toEqual([]);
  });
});

describe("isAllowed", () => {
  const list = parseAllowlist("me@example.com");

  it("matches regardless of case and spaces", () => {
    expect(isAllowed(" ME@example.com ", list)).toBe(true);
  });

  it("rejects other and missing emails", () => {
    expect(isAllowed("stranger@example.com", list)).toBe(false);
    expect(isAllowed(undefined, list)).toBe(false);
  });

  it("lets any account in with *", () => {
    expect(isAllowed("stranger@example.com", parseAllowlist("*"))).toBe(true);
    expect(isAllowed("stranger@example.com", parseAllowlist("me@example.com, *"))).toBe(true);
  });

  it("still needs an email with *", () => {
    expect(isAllowed(undefined, parseAllowlist("*"))).toBe(false);
  });

  it("rejects everyone when the list is empty", () => {
    expect(isAllowed("me@example.com", [])).toBe(false);
  });
});
