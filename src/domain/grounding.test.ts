import { describe, expect, it } from "vitest";
import { findUngroundedClaims, findUngroundedNumbers, numbersIn, WORK_STATUS_PHRASES } from "./grounding";

describe("numbersIn", () => {
  it("normalizes commas, decimals, plus signs and K/M suffixes", () => {
    expect([...numbersIn("1,000+ orders, 99.9% uptime, ~2s, 100K+ users, 3M events")].sort()).toEqual(
      ["1000", "100000", "2", "3000000", "99.9"].sort(),
    );
  });

  it("does not read a unit like ms as a million", () => {
    expect([...numbersIn("under 200ms, 5ms")]).toEqual(["200", "5"]);
  });

  it("ignores leading zeros", () => {
    expect([...numbersIn("2022-01")]).toEqual(["2022", "1"]);
  });
});

describe("findUngroundedNumbers", () => {
  const source = "Cut API latency 90% (2s to under 200ms). Handled 100,000 orders a month. 256 matches.";

  it("accepts numbers the source states, however they are written", () => {
    expect(findUngroundedNumbers(["Reduced latency 90% from ~2s to 200ms", "Synced 100K+ orders", "Ran 256 matches"], source)).toEqual([]);
  });

  it("flags numbers the source never states", () => {
    expect(findUngroundedNumbers(["Cut errors 75% across 12 services", "Ran 256 matches"], source)).toEqual(["75", "12"]);
  });

  it("lists each number once", () => {
    expect(findUngroundedNumbers(["Cut 75%", "Improved 75%"], source)).toEqual(["75"]);
  });
});

describe("findUngroundedClaims", () => {
  it("flags a claim phrase the source never states", () => {
    expect(findUngroundedClaims("Migrated the monolith without downtime", "Migrated a Rails monolith to Go")).toEqual([
      "without downtime",
    ]);
  });

  it("checks a given list of phrases, such as work status", () => {
    const source = "Based in Jakarta. Open to relocation with visa sponsorship.";
    expect(findUngroundedClaims("Relocating to London with the right to work", source, WORK_STATUS_PHRASES)).toEqual([
      "right to work",
    ]);
  });

  it("accepts a claim the source states", () => {
    expect(findUngroundedClaims("Kept high availability", "Responsible for high availability")).toEqual([]);
  });
});
