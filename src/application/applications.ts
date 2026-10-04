import { z } from "zod";
import type { Application } from "@/domain/application";
import { FitJudgementSchema, fitScore } from "@/domain/fit";
import { JobPostingSchema } from "@/domain/job";
import type {
  ApplicationRepository,
  LlmPort,
  ProfileRepository,
  ResumeRenderer,
  StoredProfile,
} from "@/domain/ports";
import type { Profile } from "@/domain/profile";
import { FIXED_QUESTIONS, MAX_GAP_QUESTIONS, type Answers } from "@/domain/questions";
import { TailoredResumeSchema, type TailoredResume } from "@/domain/resume";
import { findBannedWords, stripEmDashes } from "@/domain/writing";
import { ANALYZE_FIT_SYSTEM, EXTRACT_JOB_SYSTEM, QUESTIONS_SYSTEM } from "@/prompts/analysis";
import { profileContext } from "@/prompts/profileContext";
import { BANNED_WORDS_FIX, TAILOR_RESUME_SYSTEM } from "@/prompts/resume";

export class NoProfileError extends Error {
  constructor() {
    super("No profile yet. Import or create your profile first.");
  }
}

export class NotFoundError extends Error {}

const GapQuestionsSchema = z.object({ questions: z.array(z.string()).max(MAX_GAP_QUESTIONS) });

export type ApplicationDeps = {
  userId: string;
  now?: () => Date;
  llm: LlmPort;
  profiles: ProfileRepository;
  applications: ApplicationRepository;
  renderer: ResumeRenderer;
};

export class ApplicationService {
  constructor(private readonly deps: ApplicationDeps) {}

  // Paste a JD: extract it, score the fit, and prepare clarifying questions.
  async start(jdText: string): Promise<Application> {
    const { llm, applications, userId } = this.deps;
    const { profile } = await this.requireProfile();
    const profileYaml = profileContext(profile);

    const job = await llm.generateObject({
      tier: "fast",
      schema: JobPostingSchema,
      system: EXTRACT_JOB_SYSTEM,
      prompt: jdText,
    });

    const judgement = await llm.generateObject({
      tier: "fast",
      schema: FitJudgementSchema,
      system: ANALYZE_FIT_SYSTEM,
      prompt: `JOB POSTING (structured):\n${JSON.stringify(job, null, 2)}\n\nCANDIDATE PROFILE:\n${profileYaml}`,
    });
    const fit = { ...judgement, score: fitScore(judgement) };

    const gaps = await llm.generateObject({
      tier: "fast",
      schema: GapQuestionsSchema,
      system: QUESTIONS_SYSTEM,
      prompt: `JOB:\n${JSON.stringify(job, null, 2)}\n\nGAP ANALYSIS:\n${JSON.stringify(fit, null, 2)}\n\nCANDIDATE PROFILE:\n${profileYaml}`,
    });
    const questions = [
      ...FIXED_QUESTIONS,
      ...gaps.questions.slice(0, MAX_GAP_QUESTIONS).map((question, i) => ({ id: `gap${i + 1}`, question })),
    ];

    return applications.create({
      userId,
      company: job.company || "Unknown company",
      role: job.role || "Unknown role",
      jdText,
      job,
      fit,
      questions,
      answers: null,
      resume: null,
      typSource: null,
      pdf: null,
      pdfCreatedAt: null,
      status: "questions",
    });
  }

  // Answers in, tailored resume PDF out.
  async generate(id: number, answers: Answers): Promise<Application> {
    const app = await this.requireApplication(id);
    const { profile } = await this.requireProfile();
    const qa = app.questions.map((q) => `Q: ${q.question}\nA: ${answers[q.id]?.trim() || "(no answer)"}`).join("\n\n");
    const prompt = `${this.tailorContext(profile, app)}\n\nCANDIDATE'S ANSWERS TO CLARIFYING QUESTIONS:\n${qa}`;

    const resume = await this.tailor(profile, prompt);
    return this.renderAndSave(app, profile, resume, { answers });
  }

  // Free-text feedback on the current resume, e.g. "lead with the Pub/Sub work".
  async revise(id: number, feedback: string): Promise<Application> {
    const app = await this.requireApplication(id);
    if (!app.resume) throw new Error("Generate the resume before revising it.");
    const { profile } = await this.requireProfile();
    const prompt = `${this.tailorContext(profile, app)}\n\nCURRENT RESUME:\n${JSON.stringify(app.resume, null, 2)}\n\nREVISION REQUEST (change only what this asks, keep the rest):\n${feedback}`;

    const resume = await this.tailor(profile, prompt);
    return this.renderAndSave(app, profile, resume, {});
  }

  private tailorContext(profile: Profile, app: Application): string {
    const style = profile.writing_style;
    return [
      `JOB POSTING (raw):\n${app.jdText}`,
      `JOB POSTING (structured):\n${JSON.stringify(app.job, null, 2)}`,
      `GAP ANALYSIS (score ${app.fit.score}/100):\n${JSON.stringify(app.fit, null, 2)}`,
      `CANDIDATE PROFILE:\n${profileContext(profile)}`,
      `VOICE SAMPLE:\n${style.voice_sample || "(none)"}`,
      `NEVER MENTION: ${style.avoid_mentioning.join("; ") || "(nothing)"}`,
      `INCLUDE IF RELEVANT: ${style.always_include_if_relevant.join("; ") || "(nothing)"}`,
    ].join("\n\n");
  }

  private async tailor(profile: Profile, prompt: string): Promise<TailoredResume> {
    const { llm } = this.deps;
    let resume = await llm.generateObject({ tier: "write", schema: TailoredResumeSchema, system: TAILOR_RESUME_SYSTEM, prompt });

    const banned = findBannedWords(resumeText(resume));
    if (banned.length > 0) {
      resume = await llm.generateObject({
        tier: "write",
        schema: TailoredResumeSchema,
        system: TAILOR_RESUME_SYSTEM,
        prompt: `${prompt}\n\nYOUR DRAFT:\n${JSON.stringify(resume, null, 2)}\n\n${BANNED_WORDS_FIX(banned)}`,
      });
    }
    return cleanResume(profile, resume);
  }

  private async renderAndSave(
    app: Application,
    profile: Profile,
    resume: TailoredResume,
    patch: { answers?: Answers },
  ): Promise<Application> {
    const { typSource, pdf } = await this.deps.renderer.render({ profile, resume });
    const pdfCreatedAt = (this.deps.now ?? (() => new Date()))();
    return this.deps.applications.update(this.deps.userId, app.id, {
      ...patch,
      resume,
      typSource,
      pdf,
      pdfCreatedAt,
      status: "generated",
    });
  }

  private async requireProfile(): Promise<StoredProfile> {
    const stored = await this.deps.profiles.findByUser(this.deps.userId);
    if (!stored) throw new NoProfileError();
    return stored;
  }

  private async requireApplication(id: number): Promise<Application> {
    const app = await this.deps.applications.findById(this.deps.userId, id);
    if (!app) throw new NotFoundError(`Application ${id} not found.`);
    return app;
  }
}

function resumeText(r: TailoredResume): string {
  return [r.summary, ...r.work.flatMap((w) => w.bullets), ...r.projects.flatMap((p) => p.bullets)].join("\n");
}

// Guards against model mistakes the schema can't express: indexes outside the
// profile, duplicate roles, roles out of order, and stray em dashes.
export function cleanResume(profile: Profile, r: TailoredResume): TailoredResume {
  const seenWork = new Set<number>();
  const work = r.work
    .filter((w) => w.experienceIndex < profile.experience.length && !seenWork.has(w.experienceIndex) && seenWork.add(w.experienceIndex))
    .sort((a, b) => a.experienceIndex - b.experienceIndex);
  if (work.length === 0) throw new Error("The model returned no valid work experience. Try again.");

  const seenProjects = new Set<number>();
  const projects = r.projects.filter(
    (p) => p.projectIndex < profile.projects.length && !seenProjects.has(p.projectIndex) && seenProjects.add(p.projectIndex),
  );

  const clean = (s: string) => stripEmDashes(s).trim();
  return {
    summary: clean(r.summary),
    work: work.map((w) => ({ ...w, bullets: w.bullets.map(clean) })),
    projects: projects.map((p) => ({ ...p, bullets: p.bullets.map(clean) })),
    skills: r.skills.map((s) => ({ category: clean(s.category), items: s.items.map(clean) })),
    decisions: r.decisions,
  };
}
