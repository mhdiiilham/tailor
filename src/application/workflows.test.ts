import { describe, expect, it } from "vitest";
import type { FitJudgement } from "@/domain/fit";
import type { JobPosting } from "@/domain/job";
import { ProfileSchema } from "@/domain/profile";
import type { TailoredResume } from "@/domain/resume";
import { yearsOfExperience } from "@/domain/years";
import { FakeLlm } from "@/infrastructure/llm/fakeLlm";
import {
  analyzeJob,
  cleanResume,
  draftCoverLetter,
  reviseResume,
  tailorResume,
  type ApplicationContext,
} from "./workflows";

const profile = ProfileSchema.parse({
  personal: { name: "Ada" },
  experience: [
    { title: "Engineer", company: "New Co", start: "2022-01", end: "present", highlights: ["Built queues"] },
    { title: "Dev", company: "Old Co", start: "2019-01", end: "2021-12", highlights: ["Cut latency 90%"] },
  ],
  projects: [{ name: "Side" }],
});

const job: JobPosting = {
  company: "Acme",
  role: "Backend Engineer",
  location: "Remote",
  responsibilities: [],
  requirements: ["Go", "Kafka"],
  niceToHaves: [],
  techStack: ["Go"],
  yearsRequired: 3,
  cultureSignals: [],
};

const judgement: FitJudgement = {
  requirements: [
    { item: "Go", match: "HAVE", evidence: "New Co", tag: "" },
    { item: "Kafka", match: "MISSING", evidence: "", tag: "" },
  ],
  techStack: [{ item: "Go", match: "HAVE", evidence: "", tag: "" }],
  niceToHaves: [],
  experienceLevel: 80,
  domainFit: 60,
  angles: [],
  blockers: ["Kafka"],
};

const resume: TailoredResume = {
  summary: "Backend engineer — Go.",
  work: [{ experienceIndex: 0, bullets: ["Built queues"] }],
  projects: [],
  skills: [{ category: "Languages", items: ["Go"] }],
  availability: "",
  decisions: [],
};

const app: ApplicationContext = {
  jdText: "We need Go and Kafka",
  job,
  fit: { ...judgement, score: 74 },
  questions: [
    { id: "lead", question: "Lead with?" },
    { id: "tone", question: "Tone?" },
  ],
  answers: null,
  resume: null,
};

const steps = () => {
  const seen: number[] = [];
  return { seen, onStep: (i: number) => seen.push(i) };
};

describe("analyzeJob", () => {
  const analysis = (gapQuestions: string[]) => ({ ...judgement, gapQuestions });

  it("extracts the job, then scores fit and writes gap questions in one call", async () => {
    const llm = new FakeLlm([job, analysis(["Kafka?", "Years?"])]);
    const progress = steps();

    const out = await analyzeJob(llm, profile, "We need Go and Kafka", progress.onStep);

    expect(out.company).toBe("Acme");
    // 50*0.4 + 100*0.25 + 80*0.2 + 100*0.1 + 60*0.05 = 74
    expect(out.fit.score).toBe(74);
    expect(out.fit).not.toHaveProperty("gapQuestions");
    expect(out.questions.map((q) => q.id)).toEqual(["lead", "gap1", "gap2"]);
    expect(llm.requests).toHaveLength(2);
    expect(progress.seen).toEqual([0, 1]);
  });

  it("reads the job on the fast model and judges the fit on the write model", async () => {
    const llm = new FakeLlm([job, analysis([])]);

    await analyzeJob(llm, profile, "jd");

    expect(llm.requests.map((r) => r.tier)).toEqual(["fast", "write"]);
  });

  it("judges the fit at a low temperature with anchored scales", async () => {
    const llm = new FakeLlm([job, analysis([])]);

    await analyzeJob(llm, profile, "jd");

    expect(llm.requests[1].temperature).toBe(0.2);
    expect(llm.requests[1].system).toContain("90-100: same level and scope");
    expect(llm.requests[1].system).toContain("Judge each tool once");
    expect(llm.requests[0].temperature).toBeUndefined();
  });

  it("asks for at least one missing number among the gap questions", async () => {
    const llm = new FakeLlm([job, analysis([])]);

    await analyzeJob(llm, profile, "jd");

    expect(llm.requests[1].system).toMatch(/at least one question .* missing number/i);
  });

  it("tells the extractor to skip benefits and boilerplate and how to read years", async () => {
    const llm = new FakeLlm([job, analysis([])]);

    await analyzeJob(llm, profile, "jd");

    expect(llm.requests[0].system).toMatch(/Leave out benefits/);
    expect(llm.requests[0].system).toMatch(/yearsRequired: the minimum years/);
  });

  it("names unknown companies and roles", async () => {
    const llm = new FakeLlm([{ ...job, company: "", role: "" }, analysis([])]);
    const out = await analyzeJob(llm, profile, "jd");
    expect(out).toMatchObject({ company: "Unknown company", role: "Unknown role" });
  });
});

describe("tailorResume", () => {
  it("tailors with the write model, passes answers, and cleans the result", async () => {
    const llm = new FakeLlm([resume]);
    const progress = steps();

    const out = await tailorResume(llm, profile, app, { lead: "The latency win" }, progress.onStep);

    expect(llm.requests[0].tier).toBe("write");
    expect(llm.requests[0].prompt).toContain("A: The latency win");
    expect(llm.requests[0].prompt).toContain("A: (no answer)");
    expect(out.summary).toBe("Backend engineer, Go.");
    expect(progress.seen).toEqual([0, 1]);
  });

  it("sends the structured job and a compact fit, not the raw posting or per-item evidence", async () => {
    const llm = new FakeLlm([resume]);

    await tailorResume(llm, profile, app, {});

    const { prompt } = llm.requests[0];
    expect(prompt).not.toContain("We need Go and Kafka");
    expect(prompt).toContain("JOB POSTING (structured)");
    expect(prompt).toContain('"Kafka"');
    expect(prompt).not.toContain('"evidence"');
    expect(prompt).toContain('"blockers"');
    expect(prompt).toContain('"score":74');
  });

  it("asks for X-Y-Z bullets and forbids inventing metrics or lacking skills", async () => {
    const llm = new FakeLlm([resume]);

    await tailorResume(llm, profile, app, {});

    const { system } = llm.requests[0];
    expect(system).toContain("Accomplished [X] as measured by [Y] by doing [Z]");
    expect(system).toContain("needs a metric");
    expect(system).toContain("said they lack");
  });

  it("asks once more when a bullet opens with a weak verb or the summary has a cliche", async () => {
    const weak = {
      ...resume,
      summary: "Engineer with a proven track record.",
      work: [{ experienceIndex: 0, bullets: ["Supported the queue platform"] }],
    };
    const llm = new FakeLlm([weak, resume]);

    await tailorResume(llm, profile, app, {});

    expect(llm.requests[1].prompt).toMatch(/Banned words and cliches to replace: proven/);
    expect(llm.requests[1].prompt).toMatch(/weak verb, start with a strong one: Supported/);
  });

  it("asks once more when a bullet has a number the profile and answers never state", async () => {
    const invented = { ...resume, work: [{ experienceIndex: 0, bullets: ["Cut errors 75% across 17 services"] }] };
    const llm = new FakeLlm([invented, resume]);

    await tailorResume(llm, profile, app, {});

    expect(llm.requests[1].prompt).toMatch(/Numbers not in the profile or the candidate's answers.*: 75, 17/);
  });

  it("accepts numbers from the profile or from the candidate's answers", async () => {
    const grounded = {
      ...resume,
      work: [{ experienceIndex: 1, bullets: ["Cut latency 90% and handled 5,000 events a second"] }],
    };
    const llm = new FakeLlm([grounded]);

    await tailorResume(llm, profile, app, { lead: "We peaked at 5000 events a second" });

    expect(llm.requests).toHaveLength(1);
  });

  it("gives the computed years and the availability line to the model", async () => {
    const llm = new FakeLlm([resume]);

    await tailorResume(llm, { ...profile, availability: "Based in Lisbon. Open to relocation." }, app, {});

    expect(llm.requests[0].prompt).toMatch(/YEARS OF EXPERIENCE \(from the role dates.*\): \d+/);
    expect(llm.requests[0].prompt).toContain("AVAILABILITY:\nBased in Lisbon. Open to relocation.");
  });

  it("asks once more when the summary claims more years than the role dates give", async () => {
    const inflated = { ...resume, summary: "Backend engineer with 40+ years of Go." };
    const llm = new FakeLlm([inflated, resume]);

    await tailorResume(llm, profile, app, {});

    expect(llm.requests[1].prompt).toMatch(/The summary claims 40 years, but the roles on this resume only cover \d+/);
  });

  it("asks to keep older roles when the summary's years need them", async () => {
    const all = yearsOfExperience(profile.experience, new Date());
    const shown = yearsOfExperience([profile.experience[0]], new Date());
    const short = { ...resume, summary: `Backend engineer with ${all}+ years of Go.` };
    const llm = new FakeLlm([short, resume]);

    await tailorResume(llm, profile, app, {});

    expect(llm.requests[1].prompt).toContain(`the roles on this resume only cover ${shown} (all roles give ${all})`);
    expect(llm.requests[1].prompt).toContain("Keep the older roles");
  });

  it("asks once more when the availability line claims a work status nobody gave", async () => {
    const claimed = { ...resume, availability: "Based in Lisbon with the right to work in the UK." };
    const llm = new FakeLlm([claimed, resume]);

    await tailorResume(llm, { ...profile, availability: "Based in Lisbon." }, app, {});

    expect(llm.requests[1].prompt).toMatch(/availability line claims what the candidate never said.*right to work/);
  });

  it("asks once more when a bullet names a tool its own role never states", async () => {
    const borrowed = { ...resume, work: [{ experienceIndex: 0, bullets: ["Built queues provisioned with Terraform"] }] };
    const llm = new FakeLlm([borrowed, resume]);

    await tailorResume(llm, profile, app, {});

    expect(llm.requests[1].prompt).toMatch(/does not state.*"Terraform" in New Co/);
  });

  it("asks once more when a bullet adds a claim the role never states", async () => {
    const claimed = { ...resume, work: [{ experienceIndex: 0, bullets: ["Built queues without downtime"] }] };
    const llm = new FakeLlm([claimed, resume]);

    await tailorResume(llm, profile, app, {});

    expect(llm.requests[1].prompt).toMatch(/"without downtime" in New Co/);
  });

  it("accepts a tool the candidate named in their answers", async () => {
    const borrowed = { ...resume, work: [{ experienceIndex: 0, bullets: ["Built queues provisioned with Terraform"] }] };
    const llm = new FakeLlm([borrowed]);

    await tailorResume(llm, profile, app, { lead: "At New Co I wrote the Terraform for the queues" });

    expect(llm.requests).toHaveLength(1);
  });

  it("asks once more when the draft uses banned words", async () => {
    const sloppy = { ...resume, summary: "A passionate engineer who will leverage Go." };
    const llm = new FakeLlm([sloppy, resume]);

    const out = await tailorResume(llm, profile, app, {});

    expect(llm.requests[1].prompt).toMatch(/Banned words and cliches to replace: leverage, passionate/);
    expect(out.summary).toBe("Backend engineer, Go.");
  });
});

describe("reviseResume", () => {
  it("sends the current resume and the feedback", async () => {
    const llm = new FakeLlm([resume]);

    await reviseResume(llm, profile, { ...app, resume }, "Lead with latency");

    expect(llm.requests[0].prompt).toContain("CURRENT RESUME");
    expect(llm.requests[0].prompt).toContain("Lead with latency");
  });

  it("keeps the candidate's answers in the context, so a revision doesn't drift from them", async () => {
    const llm = new FakeLlm([resume]);

    await reviseResume(llm, profile, { ...app, resume, answers: { lead: "The latency win" } }, "Shorter bullets");

    expect(llm.requests[0].prompt).toContain("CANDIDATE'S ANSWERS TO CLARIFYING QUESTIONS");
    expect(llm.requests[0].prompt).toContain("A: The latency win");
  });

  it("needs a resume first", async () => {
    await expect(reviseResume(new FakeLlm([]), profile, app, "x")).rejects.toThrow(/resume/);
  });
});

describe("cleanResume", () => {
  it("drops unknown or duplicate indexes and restores chronological order", () => {
    const out = cleanResume(profile, {
      ...resume,
      work: [
        { experienceIndex: 1, bullets: ["b"] },
        { experienceIndex: 0, bullets: ["a"] },
        { experienceIndex: 1, bullets: ["dup"] },
        { experienceIndex: 7, bullets: ["made up"] },
      ],
      projects: [{ projectIndex: 3, bullets: ["x"] }],
    });
    expect(out.work.map((w) => w.experienceIndex)).toEqual([0, 1]);
    expect(out.work[1].bullets).toEqual(["b"]);
    expect(out.projects).toEqual([]);
  });

  it("keeps the tailored availability line", () => {
    const out = cleanResume(profile, { ...resume, availability: "Relocating to London — needs a visa. " });
    expect(out.availability).toBe("Relocating to London, needs a visa.");
  });

  it("fails when no valid role is left", () => {
    expect(() => cleanResume(profile, { ...resume, work: [{ experienceIndex: 9, bullets: ["x"] }] })).toThrow();
  });
});

describe("draftCoverLetter", () => {
  const letter = (...paragraphs: string[]) => ({ paragraphs });
  const withResume = { ...app, resume };

  it("drafts in one call, checks it, and returns plain text with a sign-off", async () => {
    const llm = new FakeLlm([
      letter(
        "Your ledger work caught my eye — it’s close to mine.",
        "I cut reconciliation to 12 minutes.",
        "Happy to talk through it.",
      ),
    ]);
    const progress = steps();

    const text = await draftCoverLetter(llm, profile, withResume, progress.onStep);

    expect(llm.requests).toHaveLength(1);
    expect(llm.requests[0].tier).toBe("write");
    expect(text).toBe(
      "Your ledger work caught my eye, it's close to mine.\n\nI cut reconciliation to 12 minutes.\n\nHappy to talk through it.\n\nBest regards,\nAda",
    );
    expect(progress.seen).toEqual([0, 1]);
  });

  it("puts the humanizing rules in the draft prompt", async () => {
    const llm = new FakeLlm([letter("a", "b", "c")]);

    await draftCoverLetter(llm, profile, withResume);

    expect(llm.requests[0].system).toContain("these AI writing patterns");
    expect(llm.requests[0].system).toContain("give it a pulse");
  });

  it("asks for one more rewrite when the letter has a number nobody gave us", async () => {
    const llm = new FakeLlm([
      letter("Your ledger work caught my eye.", "I cut costs 83% in a quarter.", "Let's talk."),
      letter("Your ledger work caught my eye.", "I cut reconciliation to 12 minutes.", "Let's talk."),
    ]);

    await draftCoverLetter(llm, profile, withResume);

    expect(llm.requests).toHaveLength(2);
    expect(llm.requests[1].prompt).toMatch(/Numbers not in the profile, resume or answers.*: 83/);
  });

  it("accepts numbers from the answers", async () => {
    const llm = new FakeLlm([letter("a", "We served 4500 users.", "c")]);

    await draftCoverLetter(llm, profile, { ...withResume, answers: { lead: "4,500 users" } });

    expect(llm.requests).toHaveLength(1);
  });

  it("asks for one more rewrite only when AI phrasing is found", async () => {
    const llm = new FakeLlm([
      letter("I am writing to express interest.", "A pivotal role.", "Thanks."),
      letter("Your ledger work caught my eye.", "I cut it to 12 minutes.", "Let's talk."),
    ]);

    const text = await draftCoverLetter(llm, profile, withResume);

    expect(llm.requests).toHaveLength(2);
    expect(llm.requests[1].system.slice(0, 20)).toBe("You edit a cover let");
    expect(llm.requests[1].prompt).toMatch(/still contains: pivotal, i am writing to express/);
    expect(text).toContain("Your ledger work caught my eye.");
  });

  it("needs a resume first", async () => {
    await expect(draftCoverLetter(new FakeLlm([]), profile, app)).rejects.toThrow(/resume/);
  });
});

