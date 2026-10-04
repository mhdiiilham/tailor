import { describe, expect, it } from "vitest";
import { ProfileSchema } from "@/domain/profile";
import type { TailoredResume } from "@/domain/resume";
import { escapeMarkup, escapeString, formatMonth, renderResumeTypst } from "./typstResume";

const profile = ProfileSchema.parse({
  personal: { name: "Ada Lovelace", email: "ada@example.com", github: "github.com/ada" },
  availability: "Based in London (UTC+0).",
  experience: [
    { title: "Engineer", company: "Analytical Co", location: "Remote", start: "2021-08", end: "present" },
    { title: "Intern", company: "Old Co", start: "2019-01", end: "2020-03" },
  ],
  projects: [{ name: "Engine", url: "engine.dev", start: "2024-01", end: "present" }],
  education: [{ degree: "BSc Mathematics", institution: "Uni", year: 2018 }],
  spoken_languages: ["English (native)"],
});

const resume: TailoredResume = {
  summary: "Backend engineer who ships.",
  work: [{ experienceIndex: 0, bullets: ["Cut latency by 90% (~2s to 200ms)", "Wrote docs — lots"] }],
  projects: [{ projectIndex: 0, bullets: ["Built it in Go"] }],
  skills: [{ category: "Languages", items: ["Go", "C#"] }],
  decisions: [],
};

describe("escapeMarkup", () => {
  it("escapes Typst markup characters", () => {
    expect(escapeMarkup("a@b #1 $5 *x* _y_ ~2s [z] <l> `c` \\")).toBe(
      "a\\@b \\#1 \\$5 \\*x\\* \\_y\\_ \\~2s \\[z\\] \\<l\\> \\`c\\` \\\\",
    );
  });

  it("escapes // so URLs don't start a comment", () => {
    expect(escapeMarkup("https://x.dev")).toBe("https:\\/\\/x.dev");
  });
});

describe("escapeString", () => {
  it("escapes quotes and backslashes", () => {
    expect(escapeString('say "hi" \\')).toBe('say \\"hi\\" \\\\');
  });
});

describe("formatMonth", () => {
  it("formats YYYY-MM and present", () => {
    expect(formatMonth("2021-08")).toBe("Aug 2021");
    expect(formatMonth("present")).toBe("Present");
  });
});

describe("renderResumeTypst", () => {
  const out = renderResumeTypst(profile, resume);

  it("takes header details from the profile", () => {
    expect(out).toContain('#let name = "Ada Lovelace"');
    expect(out).toContain('#let email = "ada@example.com"');
    expect(out).toContain("_Based in London (UTC+0)._");
  });

  it("takes title, company and dates from the profile, not the LLM", () => {
    expect(out).toContain('title: "Engineer"');
    expect(out).toContain('company: "Analytical Co"');
    expect(out).toContain('dates: dates-helper(start-date: "Aug 2021", end-date: "Present")');
    expect(out).not.toContain("Old Co");
  });

  it("escapes bullets and strips em dashes", () => {
    expect(out).toContain("- Cut latency by 90% (\\~2s to 200ms)");
    expect(out).toContain("- Wrote docs, lots");
    expect(out).not.toContain("—");
  });

  it("renders projects, education and skills", () => {
    expect(out).toContain('name: "Engine"');
    expect(out).toContain('degree: "BSc Mathematics"');
    expect(out).toContain("- *Languages*: Go, C\\#");
    expect(out).toContain("- *Spoken Languages*: English (native)");
  });

  it("omits the summary section when empty", () => {
    expect(renderResumeTypst(profile, { ...resume, summary: "" })).not.toContain("== Summary");
  });

  it("rejects an experience index that is not in the profile", () => {
    expect(() =>
      renderResumeTypst(profile, { ...resume, work: [{ experienceIndex: 9, bullets: ["x"] }] }),
    ).toThrow(/experience 9/);
  });
});
