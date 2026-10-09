import { describe, expect, it } from "vitest";
import { findUngroundedNumbers, numbersIn } from "./grounding";

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
