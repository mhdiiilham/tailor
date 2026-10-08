import { describe, expect, it } from "vitest";
import type { FitJudgement } from "@/domain/fit";
import type { JobPosting } from "@/domain/job";
import { ProfileSchema } from "@/domain/profile";
import type { TailoredResume } from "@/domain/resume";
import { MAX_QUESTIONS } from "@/domain/questions";
import { FakeLlm } from "@/infrastructure/llm/fakeLlm";
import {
  analyzeJob,
  cleanResume,
  draftCoverLetter,
  nextQuestion,
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
  it("extracts the job, scores fit in code, and adds gap questions after the fixed ones", async () => {
    const llm = new FakeLlm([job, judgement, { questions: ["Kafka?", "Years?"] }]);
    const progress = steps();

    const out = await analyzeJob(llm, profile, "We need Go and Kafka", progress.onStep);

    expect(out.company).toBe("Acme");
    // 50*0.4 + 100*0.25 + 80*0.2 + 100*0.1 + 60*0.05 = 74
    expect(out.fit.score).toBe(74);
    expect(out.questions.map((q) => q.id)).toEqual(["lead", "tone", "gap1", "gap2"]);
    expect(llm.requests.every((r) => r.tier === "fast")).toBe(true);
    expect(progress.seen).toEqual([0, 1, 2]);
  });

  it("names unknown companies and roles", async () => {
    const llm = new FakeLlm([{ ...job, company: "", role: "" }, judgement, { questions: [] }]);
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

  it("asks for X-Y-Z bullets and forbids inventing metrics or lacking skills", async () => {
    const llm = new FakeLlm([resume]);

    await tailorResume(llm, profile, app, {});

    const { system } = llm.requests[0];
    expect(system).toContain("Accomplished [X] as measured by [Y] by doing [Z]");
    expect(system).toContain("needs a metric");
    expect(system).toContain("said they lack");
  });

  it("asks once more when the draft uses banned words", async () => {
    const sloppy = { ...resume, summary: "A passionate engineer who will leverage Go." };
    const llm = new FakeLlm([sloppy, resume]);

    const out = await tailorResume(llm, profile, app, {});

    expect(llm.requests[1].prompt).toMatch(/banned words: leverage, passionate/);
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

  it("fails when no valid role is left", () => {
    expect(() => cleanResume(profile, { ...resume, work: [{ experienceIndex: 9, bullets: ["x"] }] })).toThrow();
  });
});

describe("draftCoverLetter", () => {
  const letter = (...paragraphs: string[]) => ({ paragraphs });
  const withResume = { ...app, resume };

  it("drafts, runs the humanizer pass, and returns plain text with a sign-off", async () => {
    const llm = new FakeLlm([
      letter("Draft one.", "Draft two.", "Draft three."),
      letter(
        "Your ledger work caught my eye — it’s close to mine.",
        "I cut reconciliation to 12 minutes.",
        "Happy to talk through it.",
      ),
    ]);
    const progress = steps();

    const text = await draftCoverLetter(llm, profile, withResume, progress.onStep);

    expect(llm.requests.map((r) => r.system.slice(0, 20))).toEqual(["You write a cover le", "You edit a cover let"]);
    expect(llm.requests[1].prompt).toContain("Draft one.");
    expect(text).toBe(
      "Your ledger work caught my eye, it's close to mine.\n\nI cut reconciliation to 12 minutes.\n\nHappy to talk through it.\n\nBest regards,\nAda",
    );
    expect(progress.seen).toEqual([0, 1, 2]);
  });

  it("asks for one more rewrite when AI phrasing survives the humanizer", async () => {
    const llm = new FakeLlm([
      letter("a", "b", "c"),
      letter("I am writing to express interest.", "A pivotal role.", "Thanks."),
      letter("Your ledger work caught my eye.", "I cut it to 12 minutes.", "Let's talk."),
    ]);

    const text = await draftCoverLetter(llm, profile, withResume);

    expect(llm.requests[2].prompt).toMatch(/still contains: pivotal, i am writing to express/);
    expect(text).toContain("Your ledger work caught my eye.");
  });

  it("needs a resume first", async () => {
    await expect(draftCoverLetter(new FakeLlm([]), profile, app)).rejects.toThrow(/resume/);
  });
});

describe("nextQuestion", () => {
  const turn = (question: string, answer: string) => ({ question, answer });

  it("asks the fast model and passes every earlier answer, so the next question can adapt", async () => {
    const llm = new FakeLlm([{ done: false, question: "How many events per second?" }]);

    const out = await nextQuestion(llm, profile, app, [turn("Lead with?", "The Kafka migration")]);

    expect(out).toEqual({ done: false, question: "How many events per second?" });
    expect(llm.requests[0].tier).toBe("fast");
    expect(llm.requests[0].prompt).toContain("Q: Lead with?\nA: The Kafka migration");
    expect(llm.requests[0].prompt).toContain("Backend Engineer");
  });

  it("marks a skipped question so it is never asked or written again", async () => {
    const llm = new FakeLlm([{ done: false, question: "Anything else?" }]);

    await nextQuestion(llm, profile, app, [turn("Have you used Kafka?", "")]);

    expect(llm.requests[0].prompt).toContain("Q: Have you used Kafka?\nA: (skipped, candidate has no answer)");
  });

  it("stops without calling the model once the question cap is reached", async () => {
    const llm = new FakeLlm([]);
    const turns = Array.from({ length: MAX_QUESTIONS }, (_, i) => turn(`Q${i}`, "a"));

    expect(await nextQuestion(llm, profile, app, turns)).toEqual({ done: true });
    expect(llm.requests).toHaveLength(0);
  });

  it("is done when the model says so or returns a blank question", async () => {
    expect(await nextQuestion(new FakeLlm([{ done: true, question: "" }]), profile, app, [])).toEqual({ done: true });
    expect(await nextQuestion(new FakeLlm([{ done: false, question: "  " }]), profile, app, [])).toEqual({ done: true });
  });

  it("is done instead of repeating a question that was already asked", async () => {
    const llm = new FakeLlm([{ done: false, question: " lead with? " }]);

    expect(await nextQuestion(llm, profile, app, [turn("Lead with?", "x")])).toEqual({ done: true });
  });
});
