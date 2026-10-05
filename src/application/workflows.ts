import { z } from "zod";
import type { Application } from "@/domain/application";
import { coverLetterText, CoverLetterSchema, type CoverLetterDraft } from "@/domain/coverLetter";
import { FitJudgementSchema, fitScore, type FitAnalysis } from "@/domain/fit";
import { JobPostingSchema, type JobPosting } from "@/domain/job";
import type { LlmPort } from "@/domain/ports";
import type { Profile } from "@/domain/profile";
import { FIXED_QUESTIONS, MAX_GAP_QUESTIONS, type Answers, type Question } from "@/domain/questions";
import { TailoredResumeSchema, type TailoredResume } from "@/domain/resume";
import { findBannedWords, findWritingTells, stripEmDashes, toPlainText } from "@/domain/writing";
import { ANALYZE_FIT_SYSTEM, EXTRACT_JOB_SYSTEM, QUESTIONS_SYSTEM } from "@/prompts/analysis";
import { COVER_LETTER_SYSTEM, HUMANIZE_SYSTEM, TELLS_FIX } from "@/prompts/coverLetter";
import { profileContext } from "@/prompts/profileContext";
import { BANNED_WORDS_FIX, TAILOR_RESUME_SYSTEM } from "@/prompts/resume";

// The AI steps of each use case. They run in the browser with the user's own Gemini key,
// so they do no I/O of their own: the caller passes the data in and saves the result.
// onStep(i) fires as each step starts, so the UI can show real progress.

export type OnStep = (step: number) => void;

// What the AI steps need from a saved application. Plain data, safe to pass to the browser.
export type ApplicationContext = Pick<Application, "jdText" | "job" | "fit" | "questions" | "answers" | "resume">;

export type JobAnalysis = { company: string; role: string; job: JobPosting; fit: FitAnalysis; questions: Question[] };

export const GapQuestionsSchema = z.object({ questions: z.array(z.string()).max(MAX_GAP_QUESTIONS) });

const noop: OnStep = () => {};

// Paste a JD: extract it, score the fit, and prepare clarifying questions.
export async function analyzeJob(
  llm: LlmPort,
  profile: Profile,
  jdText: string,
  onStep: OnStep = noop,
): Promise<JobAnalysis> {
  const profileYaml = profileContext(profile);

  onStep(0);
  const job = await llm.generateObject({
    tier: "fast",
    schema: JobPostingSchema,
    system: EXTRACT_JOB_SYSTEM,
    prompt: jdText,
  });

  onStep(1);
  const judgement = await llm.generateObject({
    tier: "fast",
    schema: FitJudgementSchema,
    system: ANALYZE_FIT_SYSTEM,
    prompt: `JOB POSTING (structured):\n${JSON.stringify(job, null, 2)}\n\nCANDIDATE PROFILE:\n${profileYaml}`,
  });
  const fit = { ...judgement, score: fitScore(judgement) };

  onStep(2);
  const gaps = await llm.generateObject({
    tier: "fast",
    schema: GapQuestionsSchema,
    system: QUESTIONS_SYSTEM,
    prompt: `JOB:\n${JSON.stringify(job, null, 2)}\n\nGAP ANALYSIS:\n${JSON.stringify(fit, null, 2)}\n\nCANDIDATE PROFILE:\n${profileYaml}`,
  });

  return {
    company: job.company || "Unknown company",
    role: job.role || "Unknown role",
    job,
    fit,
    questions: assembleQuestions(gaps.questions),
  };
}

export function assembleQuestions(gaps: string[]): Question[] {
  return [
    ...FIXED_QUESTIONS,
    ...gaps.slice(0, MAX_GAP_QUESTIONS).map((question, i) => ({ id: `gap${i + 1}`, question })),
  ];
}

// Answers in, tailored resume out (the server renders the PDF).
export async function tailorResume(
  llm: LlmPort,
  profile: Profile,
  app: ApplicationContext,
  answers: Answers,
  onStep: OnStep = noop,
): Promise<TailoredResume> {
  const prompt = `${tailorContext(profile, app)}\n\nCANDIDATE'S ANSWERS TO CLARIFYING QUESTIONS:\n${qaLines(app, answers)}`;
  return tailor(llm, profile, prompt, onStep);
}

// Free-text feedback on the current resume, e.g. "lead with the Pub/Sub work".
export async function reviseResume(
  llm: LlmPort,
  profile: Profile,
  app: ApplicationContext,
  feedback: string,
  onStep: OnStep = noop,
): Promise<TailoredResume> {
  if (!app.resume) throw new Error("Generate the resume before revising it.");
  const prompt = [
    tailorContext(profile, app),
    // The answers still apply: without them a revision can drift from what the candidate asked to lead with.
    `CANDIDATE'S ANSWERS TO CLARIFYING QUESTIONS:\n${qaLines(app, app.answers ?? {})}`,
    `CURRENT RESUME:\n${JSON.stringify(app.resume, null, 2)}`,
    `REVISION REQUEST (change only what this asks, keep the rest):\n${feedback}`,
  ].join("\n\n");
  return tailor(llm, profile, prompt, onStep);
}

// A plain-text cover letter: drafted, run through a humanizer pass, then checked
// for leftover AI phrasing (one more rewrite if any is found).
export async function draftCoverLetter(
  llm: LlmPort,
  profile: Profile,
  app: ApplicationContext,
  onStep: OnStep = noop,
): Promise<string> {
  if (!app.resume) throw new Error("Generate the resume before writing a cover letter.");
  const context = `${tailorContext(profile, app)}\n\nTAILORED RESUME:\n${JSON.stringify(app.resume, null, 2)}\n\nCANDIDATE'S ANSWERS:\n${qaLines(app, app.answers ?? {})}`;
  const asText = (d: CoverLetterDraft) => d.paragraphs.join("\n\n");
  const voice = `VOICE SAMPLE:\n${profile.writing_style.voice_sample || "(none)"}`;

  onStep(0);
  const draft = await llm.generateObject({
    tier: "write",
    schema: CoverLetterSchema,
    system: COVER_LETTER_SYSTEM,
    prompt: context,
  });

  onStep(1);
  let letter = await llm.generateObject({
    tier: "write",
    schema: CoverLetterSchema,
    system: HUMANIZE_SYSTEM,
    prompt: `${voice}\n\nLETTER:\n${asText(draft)}`,
  });

  onStep(2);
  const tells = findWritingTells(asText(letter));
  if (tells.length > 0) {
    letter = await llm.generateObject({
      tier: "write",
      schema: CoverLetterSchema,
      system: HUMANIZE_SYSTEM,
      prompt: `${voice}\n\nLETTER:\n${asText(letter)}\n\n${TELLS_FIX(tells)}`,
    });
  }

  return coverLetterText({ paragraphs: letter.paragraphs.map(toPlainText) }, profile.personal.name);
}

function qaLines(app: ApplicationContext, answers: Answers): string {
  return app.questions.map((q) => `Q: ${q.question}\nA: ${answers[q.id]?.trim() || "(no answer)"}`).join("\n\n");
}

function tailorContext(profile: Profile, app: ApplicationContext): string {
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

async function tailor(llm: LlmPort, profile: Profile, prompt: string, onStep: OnStep): Promise<TailoredResume> {
  onStep(0);
  let resume = await llm.generateObject({
    tier: "write",
    schema: TailoredResumeSchema,
    system: TAILOR_RESUME_SYSTEM,
    prompt,
  });

  onStep(1);
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

function resumeText(r: TailoredResume): string {
  return [r.summary, ...r.work.flatMap((w) => w.bullets), ...r.projects.flatMap((p) => p.bullets)].join("\n");
}

// Guards against model mistakes the schema can't express: indexes outside the
// profile, duplicate roles, roles out of order, and stray em dashes. The server runs
// it again on save, against its own copy of the profile.
export function cleanResume(profile: Profile, r: TailoredResume): TailoredResume {
  const seenWork = new Set<number>();
  const work = r.work
    .filter(
      (w) =>
        w.experienceIndex < profile.experience.length &&
        !seenWork.has(w.experienceIndex) &&
        seenWork.add(w.experienceIndex),
    )
    .sort((a, b) => a.experienceIndex - b.experienceIndex);
  if (work.length === 0) throw new Error("The model returned no valid work experience. Try again.");

  const seenProjects = new Set<number>();
  const projects = r.projects.filter(
    (p) =>
      p.projectIndex < profile.projects.length && !seenProjects.has(p.projectIndex) && seenProjects.add(p.projectIndex),
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
