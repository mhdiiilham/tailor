import { describe, expect, it } from "vitest";
import type { FitAnalysis } from "./fit";
import { coverableKeywords, keywordCoverage } from "./keywordCoverage";
import type { TailoredResume } from "./resume";

describe("keywordCoverage", () => {
  const text = "Built event-driven services in Go with Google Cloud Pub/Sub and Redis. Wrote C# tooling.";

  it("splits keywords into covered and not covered, ignoring case", () => {
    expect(keywordCoverage(["Go", "pub/sub", "Kafka", "REDIS"], text)).toEqual({
      covered: ["Go", "pub/sub", "REDIS"],
      missing: ["Kafka"],
    });
  });

  it("matches whole terms only", () => {
    expect(keywordCoverage(["Java"], "Wrote JavaScript")).toEqual({ covered: [], missing: ["Java"] });
    expect(keywordCoverage(["SQL"], "Used PostgreSQL")).toEqual({ covered: [], missing: ["SQL"] });
  });

  it("handles symbols in names", () => {
    expect(keywordCoverage(["C#", "C++"], "Wrote C# and C++ tools")).toEqual({ covered: ["C#", "C++"], missing: [] });
  });

  it("matches short names by exact case so Go is not the verb", () => {
    expect(keywordCoverage(["Go"], "Plans to go further")).toEqual({ covered: [], missing: ["Go"] });
  });
});

const item = (name: string, match: "HAVE" | "PARTIAL" | "MISSING") => ({ item: name, match, evidence: "", tag: "" });

const fit = {
  techStack: [item("Go", "HAVE"), item("Kafka", "MISSING"), item("Redis", "PARTIAL")],
  missingKeywords: [
    { keyword: "redis", support: "HAVE", whereToUse: "" },
    { keyword: "Event sourcing", support: "PARTIAL", whereToUse: "" },
    { keyword: "Kubernetes", support: "MISSING", whereToUse: "" },
  ],
} as unknown as FitAnalysis;

describe("coverableKeywords", () => {
  it("lists what the profile backs, once, and leaves out true gaps", () => {
    expect(coverableKeywords(fit)).toEqual(["Go", "Redis", "Event sourcing"]);
  });

  it("works for analyses saved before missingKeywords existed", () => {
    expect(coverableKeywords({ ...fit, missingKeywords: undefined } as FitAnalysis)).toEqual(["Go", "Redis"]);
  });
});

describe("resumeSearchText", () => {
  it("includes the summary, bullets, projects and skills", async () => {
    const { resumeSearchText } = await import("./keywordCoverage");
    const r: TailoredResume = {
      summary: "Backend engineer.",
      work: [{ experienceIndex: 0, bullets: ["Built queues"] }],
      projects: [{ projectIndex: 0, bullets: ["Wrote a parser"] }],
      skills: [{ category: "Languages", items: ["Go", "SQL"] }],
      availability: "",
      decisions: [],
    };
    const text = resumeSearchText(r);
    for (const part of ["Backend engineer.", "Built queues", "Wrote a parser", "Languages", "Go", "SQL"]) {
      expect(text).toContain(part);
    }
  });
});
