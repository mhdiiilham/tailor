import { describe, expect, it } from "vitest";
import type { HnJob, HnPost } from "@/domain/hn";
import { ogCard } from "./ogCard";

const job: HnJob = {
  company: "Manifest",
  role: "Senior Backend Engineer",
  location: "REMOTE (US)",
  workMode: "remote",
  salary: "$150K-$210K + equity",
  techStack: ["TypeScript", "Go", "Python", "MongoDB", "Kubernetes", "Terraform", "Helm", "CI/CD"],
  applyUrl: "",
};

const post = (over: Partial<HnPost> = {}): HnPost => ({
  id: 1,
  threadId: 2,
  author: "someone",
  postedAt: new Date("2026-10-07T00:00:00Z"),
  text: "Manifest | Senior Backend Engineer | REMOTE\n\nMore.",
  job,
  ...over,
});

describe("ogCard", () => {
  it("shows the role, company, the facts that are known and the first few technologies", () => {
    expect(ogCard(post())).toEqual({
      title: "Senior Backend Engineer",
      company: "Manifest",
      facts: ["REMOTE (US)", "$150K-$210K + equity"],
      stack: ["TypeScript", "Go", "Python", "MongoDB", "Kubernetes", "Terraform"],
    });
  });

  it("keeps the work mode when the location doesn't already say it", () => {
    expect(ogCard(post({ job: { ...job, location: "Berlin" } })).facts).toEqual([
      "Remote",
      "Berlin",
      "$150K-$210K + equity",
    ]);
  });

  it("leaves out what the post doesn't say", () => {
    const card = ogCard(post({ job: { ...job, workMode: "unknown", location: "", salary: "", techStack: [] } }));
    expect(card.facts).toEqual([]);
    expect(card.stack).toEqual([]);
  });

  it("uses the first line of the post until it has been parsed", () => {
    expect(ogCard(post({ job: null }))).toEqual({
      title: "Manifest | Senior Backend Engineer | REMOTE",
      company: "",
      facts: [],
      stack: [],
    });
  });

  it("cuts long text so it can't overflow the image", () => {
    const long = "x".repeat(300);
    const card = ogCard(post({ job: { ...job, role: long, company: long, location: long, salary: long } }));
    expect(card.title.length).toBeLessThanOrEqual(110);
    expect(card.company.length).toBeLessThanOrEqual(60);
    expect(card.title.endsWith("…")).toBe(true);
    for (const fact of card.facts) expect(fact.length).toBeLessThanOrEqual(40);
  });
});
