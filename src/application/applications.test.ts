import { describe, expect, it } from "vitest";
import type { Application, NewApplication } from "@/domain/application";
import type { FitJudgement } from "@/domain/fit";
import type { JobPosting } from "@/domain/job";
import type { ApplicationRepository, ProfileRepository, ResumeRenderer } from "@/domain/ports";
import { ProfileSchema, type Profile } from "@/domain/profile";
import type { TailoredResume } from "@/domain/resume";
import { FakeLlm } from "@/infrastructure/llm/fakeLlm";
import { ApplicationService, NoProfileError, cleanResume } from "./applications";

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

class MemoryProfiles implements ProfileRepository {
  constructor(private stored: Profile | null) {}
  async findByUser(userId: string) {
    return this.stored && userId === "alice" ? { profile: this.stored, updatedAt: new Date() } : null;
  }
  async saveForUser(_userId: string, p: Profile) {
    this.stored = p;
    return { profile: p, updatedAt: new Date() };
  }
}

class MemoryApplications implements ApplicationRepository {
  rows: Application[] = [];
  async create(app: NewApplication) {
    const row = { ...app, id: this.rows.length + 1, createdAt: new Date() };
    this.rows.push(row);
    return row;
  }
  async findById(userId: string, id: number) {
    return this.rows.find((r) => r.id === id && r.userId === userId) ?? null;
  }
  async list(userId: string) {
    return this.rows.filter((r) => r.userId === userId);
  }
  async delete() {
    return false;
  }
  async purgePdfsCreatedBefore() {
    return 0;
  }
  async update(userId: string, id: number, patch: Partial<NewApplication>) {
    const i = this.rows.findIndex((r) => r.id === id && r.userId === userId);
    this.rows[i] = { ...this.rows[i], ...patch };
    return this.rows[i];
  }
}

class RecordingRenderer implements ResumeRenderer {
  rendered: TailoredResume[] = [];
  async render({ resume }: { resume: TailoredResume }) {
    this.rendered.push(resume);
    return { typSource: "= cv", pdf: Buffer.from("%PDF") };
  }
  async previewPages() {
    return [Buffer.from("png")];
  }
  async compile() {
    return Buffer.from("%PDF");
  }
}

function setup(responses: unknown[], stored: Profile | null = profile, userId = "alice") {
  const llm = new FakeLlm(responses);
  const applications = new MemoryApplications();
  const renderer = new RecordingRenderer();
  const now = () => new Date("2026-10-04T12:00:00Z");
  const service = new ApplicationService({ userId, now, llm, profiles: new MemoryProfiles(stored), applications, renderer });
  return { llm, applications, renderer, service };
}

describe("ApplicationService.start", () => {
  it("extracts the job, scores fit in code, and adds gap questions after the fixed ones", async () => {
    const { service, llm } = setup([job, judgement, { questions: ["Kafka?", "Years?"] }]);

    const app = await service.start("We need Go and Kafka");

    expect(app.company).toBe("Acme");
    expect(app.status).toBe("questions");
    expect(app.userId).toBe("alice");
    // 50*0.4 + 100*0.25 + 80*0.2 + 100*0.1 + 60*0.05 = 74
    expect(app.fit.score).toBe(74);
    expect(app.questions.map((q) => q.id)).toEqual(["lead", "tone", "gap1", "gap2"]);
    expect(llm.requests.every((r) => r.tier === "fast")).toBe(true);
  });

  it("does not use another user's profile", async () => {
    const { service } = setup([], profile, "bob");
    await expect(service.start("jd")).rejects.toBeInstanceOf(NoProfileError);
  });

  it("requires a profile", async () => {
    const { service } = setup([], null);
    await expect(service.start("jd")).rejects.toBeInstanceOf(NoProfileError);
  });
});

describe("ApplicationService.generate", () => {
  it("tailors with the write model, passes answers, and renders a cleaned resume", async () => {
    const { service, llm, renderer } = setup([job, judgement, { questions: [] }, resume]);
    const app = await service.start("jd");

    const done = await service.generate(app.id, { lead: "The latency win" });

    const tailorRequest = llm.requests[3];
    expect(tailorRequest.tier).toBe("write");
    expect(tailorRequest.prompt).toContain("A: The latency win");
    expect(tailorRequest.prompt).toContain("A: (no answer)");
    expect(renderer.rendered[0].summary).toBe("Backend engineer, Go.");
    expect(done).toMatchObject({ status: "generated", typSource: "= cv", answers: { lead: "The latency win" } });
    expect(done.pdf?.toString()).toBe("%PDF");
    expect(done.pdfCreatedAt).toEqual(new Date("2026-10-04T12:00:00Z"));
  });

  it("asks once more when the draft uses banned words", async () => {
    const sloppy = { ...resume, summary: "A passionate engineer who will leverage Go." };
    const { service, llm, renderer } = setup([job, judgement, { questions: [] }, sloppy, resume]);
    const app = await service.start("jd");

    await service.generate(app.id, {});

    expect(llm.requests[4].prompt).toMatch(/banned words: leverage, passionate/);
    expect(renderer.rendered[0].summary).toBe("Backend engineer, Go.");
  });
});

describe("ApplicationService.revise", () => {
  it("sends the current resume and the feedback", async () => {
    const { service, llm } = setup([job, judgement, { questions: [] }, resume, resume]);
    const app = await service.start("jd");
    await service.generate(app.id, {});

    await service.revise(app.id, "Lead with latency");

    expect(llm.requests[4].prompt).toContain("CURRENT RESUME");
    expect(llm.requests[4].prompt).toContain("Lead with latency");
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
