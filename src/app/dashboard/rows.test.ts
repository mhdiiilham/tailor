import { describe, expect, it } from "vitest";
import { filterRows, summarize, type ApplicationRow } from "./rows";

const row = (over: Partial<ApplicationRow>): ApplicationRow => ({
  id: 1,
  role: "Backend Engineer",
  company: "StraitsX",
  location: "Singapore",
  stack: ["Go", "Kafka"],
  score: 80,
  status: "generated",
  createdAt: "2026-10-04T00:00:00.000Z",
  ...over,
});

const rows = [
  row({ id: 1 }),
  row({ id: 2, role: "Platform Architect", company: "Carousell", stack: ["Kubernetes"], score: 70, status: "questions" }),
];

describe("filterRows", () => {
  it("searches role, company, location and stack, ignoring case", () => {
    expect(filterRows(rows, "kafka", "all").map((r) => r.id)).toEqual([1]);
    expect(filterRows(rows, "CAROUSELL", "all").map((r) => r.id)).toEqual([2]);
    expect(filterRows(rows, "singapore", "all")).toHaveLength(2);
  });

  it("filters by status", () => {
    expect(filterRows(rows, "", "questions").map((r) => r.id)).toEqual([2]);
    expect(filterRows(rows, "", "all")).toHaveLength(2);
  });
});

describe("summarize", () => {
  it("counts by status and averages the fit", () => {
    expect(summarize(rows)).toEqual({ total: 2, ready: 1, waiting: 1, averageFit: 75 });
  });

  it("has no average without applications", () => {
    expect(summarize([]).averageFit).toBeNull();
  });
});
