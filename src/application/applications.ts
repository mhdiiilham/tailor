import { z } from "zod";
import type { Application } from "@/domain/application";
import { FitJudgementSchema, fitScore } from "@/domain/fit";
import { JobPostingSchema } from "@/domain/job";
import type { ApplicationRepository, ProfileRepository, ResumeRenderer, StoredProfile } from "@/domain/ports";
import type { Profile } from "@/domain/profile";
import { FIXED_QUESTIONS, MAX_GAP_QUESTIONS, QuestionSchema, type Answers } from "@/domain/questions";
import { StageSchema } from "@/domain/stage";
import { TailoredResumeSchema, type TailoredResume } from "@/domain/resume";
import { toPlainText } from "@/domain/writing";
import { assembleQuestions, cleanResume } from "./workflows";

export class NoProfileError extends Error {
  constructor() {
    super("No profile yet. Import or create your profile first.");
  }
}

export class NotFoundError extends Error {}

export const MIN_JD_LENGTH = 200;
const MAX_JD_LENGTH = 50_000;
const MAX_INPUT_CHARS = 200_000;

// What the browser sends after running the AI steps. Every field is untrusted:
// it's parsed here, the fit score is recomputed, and the fixed questions come from code.
const NewApplicationInput = z.object({
  jdText: z
    .string()
    .trim()
    .min(MIN_JD_LENGTH, "That looks too short for a job description. Paste the whole posting.")
    .max(MAX_JD_LENGTH, "That job description is too long."),
  job: JobPostingSchema,
  fit: FitJudgementSchema,
  questions: z.array(QuestionSchema).max(FIXED_QUESTIONS.length + MAX_GAP_QUESTIONS),
});

const SaveResumeInput = z.object({
  resume: TailoredResumeSchema,
  answers: z.record(z.string(), z.string().max(4_000)).optional(),
});

const CoverLetterInput = z.string().trim().min(1, "The cover letter is empty.").max(20_000);

// Only http(s) links are kept, so a stored link can never run script when clicked.
const JobUrl = z
  .string()
  .trim()
  .max(2_000)
  .refine((v) => v === "" || /^https?:\/\/[^\s]+$/i.test(v), "That link doesn't look like a web address.")
  .transform((v) => v || null);
const Notes = z
  .string()
  .max(5_000)
  .transform((v) => v.trim() || null);

const TrackInput = z.object({
  company: z.string().trim().min(1, "Add the company.").max(200),
  role: z.string().trim().min(1, "Add the role.").max(200),
  jobUrl: JobUrl.optional(),
  location: z.string().trim().max(200).optional(),
  stage: StageSchema.default("applied"),
  // "YYYY-MM-DD" from a date input; today when left empty.
  appliedOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal("")),
  notes: Notes.optional(),
});

const DetailsInput = z.object({ jobUrl: JobUrl, notes: Notes });

export type ApplicationDeps = {
  userId: string;
  now?: () => Date;
  profiles: ProfileRepository;
  applications: ApplicationRepository;
  renderer: ResumeRenderer;
};

// Saves what the browser's AI steps produced (see workflows.ts). The Gemini key
// never reaches this service: it only validates, renders and stores.
export class ApplicationService {
  constructor(private readonly deps: ApplicationDeps) {}

  async create(input: unknown): Promise<Application> {
    const { jdText, job, fit, questions } = NewApplicationInput.parse(withinSize(input));
    await this.requireProfile();
    const gaps = questions.filter((q) => q.id.startsWith("gap")).map((q) => q.question);

    return this.deps.applications.create({
      userId: this.deps.userId,
      company: job.company || "Unknown company",
      role: job.role || "Unknown role",
      jdText,
      job,
      fit: { ...fit, score: fitScore(fit) },
      questions: assembleQuestions(gaps),
      answers: null,
      resume: null,
      typSource: null,
      pdf: null,
      pdfCreatedAt: null,
      coverLetter: null,
      jobUrl: null,
      notes: null,
      status: "questions",
      stage: "not_applied",
      stageUpdatedAt: null,
      appliedAt: null,
    });
  }

  // A job added by hand, only to keep track of it. Nothing is analyzed and no
  // profile is needed; it can be analyzed later with analyzeTracked.
  async track(input: unknown): Promise<Application> {
    const t = TrackInput.parse(withinSize(input));
    const now = this.now();
    const applied = t.stage !== "not_applied";
    return this.deps.applications.create({
      userId: this.deps.userId,
      company: t.company,
      role: t.role,
      jdText: "",
      job: {
        company: t.company,
        role: t.role,
        location: t.location ?? "",
        responsibilities: [],
        requirements: [],
        niceToHaves: [],
        techStack: [],
        yearsRequired: null,
        cultureSignals: [],
      },
      fit: null,
      questions: [],
      answers: null,
      resume: null,
      typSource: null,
      pdf: null,
      pdfCreatedAt: null,
      coverLetter: null,
      jobUrl: t.jobUrl ?? null,
      notes: t.notes ?? null,
      status: "tracked",
      stage: t.stage,
      stageUpdatedAt: now,
      appliedAt: applied ? (t.appliedOn ? new Date(`${t.appliedOn}T00:00:00Z`) : now) : null,
    });
  }

  // Pasting the job description into a tracked job: the browser's analysis is checked
  // like a new one, and the job keeps its stage, dates, link, notes and the names typed in.
  async analyzeTracked(id: number, input: unknown): Promise<Application> {
    const { jdText, job, fit, questions } = NewApplicationInput.parse(withinSize(input));
    const app = await this.requireApplication(id);
    if (app.status !== "tracked") throw new Error("This job is already analyzed.");
    await this.requireProfile();
    const gaps = questions.filter((q) => q.id.startsWith("gap")).map((q) => q.question);
    return this.deps.applications.update(this.deps.userId, id, {
      jdText,
      job: { ...job, location: job.location || app.job.location },
      fit: { ...fit, score: fitScore(fit) },
      questions: assembleQuestions(gaps),
      status: "questions",
    });
  }

  // The posting link and the person's notes, on any application.
  async saveDetails(id: number, input: unknown): Promise<Application> {
    const details = DetailsInput.parse(withinSize(input));
    await this.requireApplication(id);
    return this.deps.applications.update(this.deps.userId, id, details);
  }

  // A new or revised resume. Revisions send no answers, so the earlier ones are kept.
  async saveResume(id: number, input: unknown): Promise<Application> {
    const parsed = SaveResumeInput.parse(withinSize(input));
    const app = await this.requireApplication(id);
    if (!app.fit) throw new Error("Analyze the job description first.");
    const { profile } = await this.requireProfile();
    const answers = parsed.answers ? onlyAskedQuestions(app, parsed.answers) : undefined;
    // Cleaned again against the stored profile: the browser's copy isn't trusted.
    return this.renderAndSave(app, profile, cleanResume(profile, parsed.resume), answers ? { answers } : {});
  }

  async saveCoverLetter(id: number, text: unknown): Promise<Application> {
    const coverLetter = toPlainText(CoverLetterInput.parse(text));
    const app = await this.requireApplication(id);
    if (!app.resume) throw new Error("Generate the resume before writing a cover letter.");
    return this.deps.applications.update(this.deps.userId, app.id, { coverLetter });
  }

  // The Typst source is always built here from the resume data, never taken from the browser.
  private async renderAndSave(
    app: Application,
    profile: Profile,
    resume: TailoredResume,
    patch: { answers?: Answers },
  ): Promise<Application> {
    const { typSource, pdf } = await this.deps.renderer.render({ profile, resume });
    const pdfCreatedAt = this.now();
    return this.deps.applications.update(this.deps.userId, app.id, {
      ...patch,
      resume,
      typSource,
      pdf,
      pdfCreatedAt,
      status: "generated",
    });
  }

  private now(): Date {
    return (this.deps.now ?? (() => new Date()))();
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

function withinSize(input: unknown): unknown {
  if (JSON.stringify(input ?? null).length > MAX_INPUT_CHARS) throw new Error("That request is too large.");
  return input;
}

function onlyAskedQuestions(app: Application, answers: Answers): Answers {
  return Object.fromEntries(app.questions.filter((q) => q.id in answers).map((q) => [q.id, answers[q.id]]));
}
