import type { FitAnalysis } from "./fit";
import type { JobPosting } from "./job";
import type { Answers, Question } from "./questions";
import type { TailoredResume } from "./resume";
import type { Stage } from "./stage";

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
  status: ApplicationStatus;
  // Job-hunt progress, set by the user.
  stage: Stage;
  stageUpdatedAt: Date | null;
  appliedAt: Date | null;
  createdAt: Date;
};

export type NewApplication = Omit<Application, "id" | "createdAt">;
