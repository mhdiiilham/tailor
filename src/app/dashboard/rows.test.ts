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
  stage: "applied",
  appliedAt: "2026-10-04T00:00:00.000Z",
  createdAt: "2026-10-04T00:00:00.000Z",
  ...over,
});

const rows = [
  row({ id: 1 }),
  row({ id: 2, role: "Platform Architect", company: "Carousell", stack: ["Kubernetes"], score: 70, stage: "not_applied", appliedAt: null }),
  row({ id: 3, role: "Go Engineer", company: "Grab", stage: "rejected" }),
  row({ id: 4, role: "Staff Engineer", company: "Aspire", stage: "interviewing", score: 90 }),
];

describe("filterRows", () => {
  it("searches role, company, location and stack, ignoring case", () => {
    expect(filterRows(rows, "kafka", "all").map((r) => r.id)).toEqual([1, 3, 4]);
    expect(filterRows(rows, "CAROUSELL", "all").map((r) => r.id)).toEqual([2]);
  });

  it("filters by stage, grouping rejected and withdrawn as closed", () => {
    expect(filterRows(rows, "", "not_applied").map((r) => r.id)).toEqual([2]);
    expect(filterRows(rows, "", "closed").map((r) => r.id)).toEqual([3]);
    expect(filterRows(rows, "", "interviewing").map((r) => r.id)).toEqual([4]);
  });

  it("combines search and stage", () => {
    expect(filterRows(rows, "grab", "closed").map((r) => r.id)).toEqual([3]);
    expect(filterRows(rows, "grab", "applied")).toEqual([]);
  });
});

describe("summarize", () => {
  it("counts applied, interviews and offers, and averages the fit", () => {
    expect(summarize(rows)).toEqual({ total: 4, averageFit: 80, applied: 3, interviewing: 1, offers: 0 });
  });

  it("has no average without applications", () => {
    expect(summarize([]).averageFit).toBeNull();
  });
});
