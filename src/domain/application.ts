import type { FitAnalysis } from "./fit";
import type { JobPosting } from "./job";
import type { Answers, Question } from "./questions";
import type { TailoredResume } from "./resume";
import type { Stage, StageFilter } from "./stage";

export type ApplicationStatus = "questions" | "generated";

export type Application = {
  id: number;
  userId: string;
  company: string;
  role: string;
  jdText: string;
  job: JobPosting;
  fit: FitAnalysis;
  questions: Question[];
  answers: Answers | null;
  resume: TailoredResume | null;
  typSource: string | null;
  pdf: Buffer | null;
  pdfCreatedAt: Date | null;
  // Plain text, ready to paste. Null until the user asks for one.
  coverLetter: string | null;
  status: ApplicationStatus;
  // Job-hunt progress, set by the user.
  stage: Stage;
  stageUpdatedAt: Date | null;
  appliedAt: Date | null;
  createdAt: Date;
};

export type NewApplication = Omit<Application, "id" | "createdAt">;

// One row of the applications list: only what the table shows, never the PDF or JD.
export type ApplicationSummary = {
  id: number;
  role: string;
  company: string;
  location: string;
  techStack: string[];
  score: number;
  status: ApplicationStatus;
  stage: Stage;
  appliedAt: Date | null;
  createdAt: Date;
};

// Newest first. `cursor` is the id of the last row already shown; the page holds
// the rows that come after it.
export type ApplicationPageQuery = { stage: StageFilter; search: string; cursor?: number; limit: number };
export type ApplicationPage = { items: ApplicationSummary[]; nextCursor: number | null };

// Per-stage totals for the tabs and the status strip.
export type StageStats = { stage: Stage; count: number; applied: number; scoreSum: number };
