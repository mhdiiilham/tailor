import { describe, expect, it } from "vitest";
import { yearsClaimed, yearsOfExperience } from "./years";

const today = new Date(2026, 9, 10); // Oct 2026

describe("yearsOfExperience", () => {
  it("counts whole years, both end months included", () => {
    expect(yearsOfExperience([{ start: "2020-01", end: "2021-12" }], today)).toBe(2);
    expect(yearsOfExperience([{ start: "2020-01", end: "2021-11" }], today)).toBe(1);
  });

  it("counts overlapping roles once", () => {
    const roles = [
      { start: "2020-01", end: "2021-12" },
      { start: "2021-01", end: "2021-06" },
    ];
    expect(yearsOfExperience(roles, today)).toBe(2);
  });

  it("leaves gaps out and runs present roles to this month", () => {
    const roles = [
      { start: "2023-04", end: "2025-01" }, // 22 months
      { start: "2025-10", end: "present" }, // 13 months
    ];
    expect(yearsOfExperience(roles, today)).toBe(2);
  });
});

describe("yearsClaimed", () => {
  it("reads year claims with or without a plus", () => {
    expect(yearsClaimed("Engineer with 6+ years of Go, 5 years of SQL")).toEqual([6, 5]);
  });

  it("ignores other numbers", () => {
    expect(yearsClaimed("Cut latency from 30s to 200ms for 2,500+ players")).toEqual([]);
  });
});
