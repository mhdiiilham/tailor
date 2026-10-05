import { describe, expect, it } from "vitest";
import type { ApplicationSummary, StageStats } from "@/domain/application";
import { summarize, toRow } from "./rows";

describe("toRow", () => {
  it("serializes a summary for the client and keeps the first four stack items", () => {
    const summary: ApplicationSummary = {
      id: 7,
      role: "Backend Engineer",
      company: "StraitsX",
      location: "Singapore",
      techStack: ["Go", "Kafka", "Postgres", "Redis", "gRPC"],
      score: 80,
      status: "generated",
      stage: "applied",
      appliedAt: new Date("2026-10-04T00:00:00Z"),
      createdAt: new Date("2026-10-03T00:00:00Z"),
    };
    expect(toRow(summary)).toEqual({
      id: 7,
      role: "Backend Engineer",
      company: "StraitsX",
      location: "Singapore",
      stack: ["Go", "Kafka", "Postgres", "Redis"],
      score: 80,
      status: "generated",
      stage: "applied",
      appliedAt: "2026-10-04T00:00:00.000Z",
      createdAt: "2026-10-03T00:00:00.000Z",
    });
  });
});

describe("summarize", () => {
  const stats: StageStats[] = [
    { stage: "applied", count: 3, applied: 3, scored: 2, scoreSum: 160 },
    { stage: "not_applied", count: 1, applied: 0, scored: 1, scoreSum: 70 },
    { stage: "rejected", count: 1, applied: 1, scored: 1, scoreSum: 80 },
    { stage: "withdrawn", count: 1, applied: 1, scored: 1, scoreSum: 60 },
    { stage: "interviewing", count: 1, applied: 1, scored: 1, scoreSum: 90 },
  ];

  it("counts applied, interviews and offers, and averages the fit of analyzed jobs only", () => {
    // 460 over the 6 scored jobs; the tracked one (in "applied") has no score.
    expect(summarize(stats)).toMatchObject({ total: 7, averageFit: 77, applied: 6, interviewing: 1, offers: 0 });
  });

  it("counts each filter tab, grouping rejected and withdrawn as closed", () => {
    expect(summarize(stats).byFilter).toEqual({
      all: 7,
      not_applied: 1,
      applied: 3,
      interviewing: 1,
      offer: 0,
      closed: 2,
    });
  });

  it("has no average without applications", () => {
    expect(summarize([]).averageFit).toBeNull();
  });
});
