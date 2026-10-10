import { z } from "zod";
import type { Application } from "@/domain/application";
import { coverLetterText, CoverLetterSchema, type CoverLetterDraft } from "@/domain/coverLetter";
import { FitJudgementSchema, fitScore, type FitAnalysis, type MatchedItem } from "@/domain/fit";
import { JobPostingSchema, type JobPosting } from "@/domain/job";
import type { LlmPort } from "@/domain/ports";
import type { Profile } from "@/domain/profile";
import { FIXED_QUESTIONS, MAX_GAP_QUESTIONS, type Answers, type Question } from "@/domain/questions";
import { TailoredResumeSchema, type TailoredResume } from "@/domain/resume";
import { findUngroundedClaims, findUngroundedNumbers, WORK_STATUS_PHRASES } from "@/domain/grounding";
import { resumeSearchText } from "@/domain/keywordCoverage";
import { findUnbackedTerms } from "@/domain/techTerms";
import { yearsClaimed, yearsOfExperience } from "@/domain/years";
import { findResumeTells, findWeakOpeners, findWritingTells, stripEmDashes, toPlainText } from "@/domain/writing";
import { ANALYZE_FIT_SYSTEM, EXTRACT_JOB_SYSTEM } from "@/prompts/analysis";
import { COVER_LETTER_SYSTEM, HUMANIZE_SYSTEM, NUMBERS_FIX, TELLS_FIX } from "@/prompts/coverLetter";
import { profileContext } from "@/prompts/profileContext";
import { TAILOR_FIX, TAILOR_RESUME_SYSTEM } from "@/prompts/resume";

// The AI steps of each use case. They run in the browser with the user's own Gemini key,
// so they do no I/O of their own: the caller passes the data in and saves the result.
// onStep(i) fires as each step starts, so the UI can show real progress.

export type OnStep = (step: number) => void;

// What the AI steps need from a saved application. Plain data, safe to pass to the browser.
// Only analyzed applications have a fit, and only they reach the resume steps.
export type ApplicationContext = Pick<Application, "jdText" | "job" | "questions" | "answers" | "resume"> & {
  fit: FitAnalysis;
};

export type JobAnalysis = { company: string; role: string; job: JobPosting; fit: FitAnalysis; questions: Question[] };

// One call judges the fit and writes the questions about its gaps, so the profile is sent once.
// gapQuestions comes last in the schema: the model has written the gaps by the time it asks.
export const FitAndQuestionsSchema = FitJudgementSchema.extend({
  gapQuestions: z.array(z.string()).max(MAX_GAP_QUESTIONS),
});

const noop: OnStep = () => {};

// Judging the same posting twice should give nearly the same score.
const JUDGE_TEMPERATURE = 0.2;

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
  const { gapQuestions, ...judgement } = await llm.generateObject({
    // The fit decides the score and what the resume leads with, so it gets the stronger model.
    tier: "write",
    temperature: JUDGE_TEMPERATURE,
    schema: FitAndQuestionsSchema,
    system: ANALYZE_FIT_SYSTEM,
    prompt: `JOB POSTING (structured):\n${JSON.stringify(job, null, 2)}\n\nCANDIDATE PROFILE:\n${profileYaml}`,
  });
  const fit = { ...judgement, score: fitScore(judgement) };

  return {
    company: job.company || "Unknown company",
    role: job.role || "Unknown role",
    job,
    fit,
    questions: assembleQuestions(gapQuestions),
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
  return tailor(llm, profile, prompt, Object.values(answers), onStep);
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
  return tailor(llm, profile, prompt, [...Object.values(app.answers ?? {}), feedback], onStep);
}

// A plain-text cover letter: drafted with the humanizing rules already in the prompt, then
// checked in code for leftover AI phrasing (one more rewrite only if any is found).
export async function draftCoverLetter(
  llm: LlmPort,
  profile: Profile,
  app: ApplicationContext,
  onStep: OnStep = noop,
): Promise<string> {
  if (!app.resume) throw new Error("Generate the resume before writing a cover letter.");
  const context = `${tailorContext(profile, app)}\n\nTAILORED RESUME:\n${JSON.stringify(app.resume)}\n\nCANDIDATE'S ANSWERS:\n${qaLines(app, app.answers ?? {})}`;
  const asText = (d: CoverLetterDraft) => d.paragraphs.join("\n\n");
  const voice = `VOICE SAMPLE:\n${profile.writing_style.voice_sample || "(none)"}`;

  onStep(0);
  let letter = await llm.generateObject({
    tier: "write",
    schema: CoverLetterSchema,
    system: COVER_LETTER_SYSTEM,
    prompt: context,
  });

  onStep(1);
  const tells = findWritingTells(asText(letter));
  // Numbers may come from the profile, the answers or the resume (already checked).
  const source = groundingSource(profile, [...Object.values(app.answers ?? {}), resumeSearchText(app.resume)]);
  const invented = findUngroundedNumbers([asText(letter)], source);
  if (tells.length > 0 || invented.length > 0) {
    const fixes = [tells.length > 0 ? TELLS_FIX(tells) : "", invented.length > 0 ? NUMBERS_FIX(invented) : ""];
    letter = await llm.generateObject({
      tier: "write",
      schema: CoverLetterSchema,
      system: HUMANIZE_SYSTEM,
      prompt: `${voice}\n\nLETTER:\n${asText(letter)}\n\n${fixes.filter(Boolean).join("\n")}`,
    });
  }

  return coverLetterText({ paragraphs: letter.paragraphs.map(toPlainText) }, profile.personal.name);
}

// What the writing steps need from the fit: the verdicts, strongest angles, blockers and keywords.
// Per-item evidence and tags are left out; the profile is in the prompt anyway.
function compactFit(fit: FitAnalysis) {
  const marks = (items: MatchedItem[]) => items.map((i) => ({ item: i.item, match: i.match }));
  return {
    score: fit.score,
    requirements: marks(fit.requirements),
    techStack: marks(fit.techStack),
    niceToHaves: marks(fit.niceToHaves),
    angles: fit.angles,
    blockers: fit.blockers,
    missingKeywords: fit.missingKeywords ?? [],
  };
}

function qaLines(app: ApplicationContext, answers: Answers): string {
  return app.questions.map((q) => `Q: ${q.question}\nA: ${answers[q.id]?.trim() || "(no answer)"}`).join("\n\n");
}

function tailorContext(profile: Profile, app: ApplicationContext): string {
  const style = profile.writing_style;
  return [
    `JOB POSTING (structured):\n${JSON.stringify(app.job)}`,
    `GAP ANALYSIS:\n${JSON.stringify(compactFit(app.fit))}`,
    `CANDIDATE PROFILE:\n${profileContext(profile)}`,
    `YEARS OF EXPERIENCE (from the role dates, gaps left out, overlapping roles counted once): ${careerYears(profile)}`,
    `AVAILABILITY:\n${profile.availability || "(none)"}`,
    `VOICE SAMPLE:\n${style.voice_sample || "(none)"}`,
    `NEVER MENTION: ${style.avoid_mentioning.join("; ") || "(nothing)"}`,
    `INCLUDE IF RELEVANT: ${style.always_include_if_relevant.join("; ") || "(nothing)"}`,
  ].join("\n\n");
}

// Everything the candidate has told us. A number in a bullet must come from here.
function groundingSource(profile: Profile, said: string[]): string {
  return [profileContext(profile), ...said].join("\n");
}

async function tailor(
  llm: LlmPort,
  profile: Profile,
  prompt: string,
  said: string[],
  onStep: OnStep,
): Promise<TailoredResume> {
  onStep(0);
  let resume = await llm.generateObject({
    tier: "write",
    schema: TailoredResumeSchema,
    system: TAILOR_RESUME_SYSTEM,
    prompt,
  });

  onStep(1);
  const problems = resumeProblems(resume, profile, said);
  if (problems.length > 0) {
    resume = await llm.generateObject({
      tier: "write",
      schema: TailoredResumeSchema,
      system: TAILOR_RESUME_SYSTEM,
      prompt: `${prompt}\n\nYOUR DRAFT:\n${JSON.stringify(resume, null, 2)}\n\n${TAILOR_FIX(problems)}`,
    });
  }
  return cleanResume(profile, resume);
}

// What code can catch in a draft: banned words and cliches, bullets that open with a duty, invented
// numbers, and tools or claims a bullet adds that its own role or project never states.
function resumeProblems(r: TailoredResume, profile: Profile, said: string[]): string[] {
  const problems: string[] = [];
  const tells = findResumeTells(resumeText(r));
  if (tells.length > 0) problems.push(`Banned words and cliches to replace: ${tells.join(", ")}`);
  const openers = findWeakOpeners(bulletsOf(r));
  if (openers.length > 0) problems.push(`Bullets open with a weak verb, start with a strong one: ${openers.join(", ")}`);
  const years = careerYears(profile);
  const invented = findUngroundedNumbers([r.summary, ...bulletsOf(r)], `${groundingSource(profile, said)}\n${years}`);
  if (invented.length > 0) {
    problems.push(
      `Numbers not in the profile or the candidate's answers, remove them or use what the profile says: ${invented.join(", ")}`,
    );
  }
  // A recruiter counts the dates on the page, so a claim must match the roles kept, not the whole profile.
  const shown = yearsOfExperience(
    r.work.flatMap((w) => profile.experience[w.experienceIndex] ?? []),
    new Date(),
  );
  const claimed = yearsClaimed(r.summary).filter((n) => n !== shown);
  if (claimed.length > 0) {
    problems.push(
      shown < years
        ? `The summary claims ${claimed.join(", ")} years, but the roles on this resume only cover ${shown} (all roles give ${years}). Keep the older roles with 2-3 bullets each so the dates add up to ${years}, or say ${shown}.`
        : `The summary claims ${claimed.join(", ")} years, the role dates give ${years}. Use ${years} or ${years}+.`,
    );
  }
  const status = findUngroundedClaims(r.availability ?? "", profile.availability, WORK_STATUS_PHRASES);
  if (status.length > 0) {
    problems.push(`The availability line claims what the candidate never said, remove it: ${status.join(", ")}`);
  }
  const added = addedDetails(r, profile, said);
  if (added.length > 0) {
    problems.push(
      `Details the bullet's own role or project does not state, remove them or use only what that highlight says: ${added.join("; ")}`,
    );
  }
  return problems;
}

// Each bullet may only name tools and claims found in the role or project it belongs to
// (or in what the candidate said), not ones borrowed from elsewhere in the profile.
function addedDetails(r: TailoredResume, profile: Profile, said: string[]): string[] {
  const found: string[] = [];
  const check = (label: string, bullets: string[], own: string) => {
    const source = [own, ...said].join("\n");
    for (const bullet of bullets) {
      for (const detail of [...findUnbackedTerms(bullet, source), ...findUngroundedClaims(bullet, source)]) {
        found.push(`"${detail}" in ${label}`);
      }
    }
  };
  for (const w of r.work) {
    const role = profile.experience[w.experienceIndex];
    if (role) check(role.company, w.bullets, role.highlights.join("\n"));
  }
  for (const p of r.projects) {
    const project = profile.projects[p.projectIndex];
    if (project) check(project.name, p.bullets, [project.description, ...project.tech, ...project.highlights].join("\n"));
  }
  return [...new Set(found)];
}

// Computed from the dates, not taken from the profile's summary, so the resume can't claim more than it shows.
function careerYears(profile: Profile): number {
  return yearsOfExperience(profile.experience, new Date());
}

function bulletsOf(r: TailoredResume): string[] {
  return [...r.work.flatMap((w) => w.bullets), ...r.projects.flatMap((p) => p.bullets)];
}

function resumeText(r: TailoredResume): string {
  return [r.summary, ...bulletsOf(r)].join("\n");
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
    availability: clean(r.availability ?? ""),
    decisions: r.decisions,
  };
}
