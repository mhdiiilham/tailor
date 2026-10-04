import { describe, expect, it } from "vitest";
import { coverage, fitScore, type FitJudgement } from "./fit";

const item = (match: "HAVE" | "PARTIAL" | "MISSING") => ({ item: "x", match, evidence: "" });

const judgement = (over: Partial<FitJudgement> = {}): FitJudgement => ({
  requirements: [],
  techStack: [],
  niceToHaves: [],
  experienceLevel: 100,
  domainFit: 100,
  angles: [],
  blockers: [],
  ...over,
});

describe("coverage", () => {
  it("gives half credit for PARTIAL", () => {
    expect(coverage([item("HAVE"), item("PARTIAL"), item("MISSING"), item("MISSING")])).toBe(37.5);
  });

  it("treats an empty list as fully met", () => {
    expect(coverage([])).toBe(100);
  });
});

describe("fitScore", () => {
  it("is 100 when everything matches", () => {
    expect(fitScore(judgement({ requirements: [item("HAVE")] }))).toBe(100);
  });

  it("applies the 40/25/20/10/5 weights", () => {
    const score = fitScore(
      judgement({
        requirements: [item("HAVE"), item("MISSING")], // 50 * 0.4 = 20
        techStack: [item("MISSING")], // 0
        experienceLevel: 50, // 10
        niceToHaves: [item("HAVE")], // 10
        domainFit: 0, // 0
      }),
    );
    expect(score).toBe(40);
  });
});
