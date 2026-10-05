import type { ApplicationStatus, ApplicationSummary, StageStats } from "@/domain/application";
import { STAGE_FILTERS, stagesFor, type Stage, type StageFilter } from "@/domain/stage";

// What the dashboard table needs, serializable for the client component.
export type ApplicationRow = {
  id: number;
  role: string;
  company: string;
  location: string;
  stack: string[];
  score: number | null;
  status: ApplicationStatus;
  stage: Stage;
  appliedAt: string | null;
  createdAt: string;
};

export type RowPage = { rows: ApplicationRow[]; nextCursor: string | null };

export const PAGE_SIZE = 10;

export function toRow(app: ApplicationSummary): ApplicationRow {
  return {
    id: app.id,
    role: app.role,
    company: app.company,
    location: app.location,
    stack: app.techStack.slice(0, 4),
    score: app.score,
    status: app.status,
    stage: app.stage,
    appliedAt: app.appliedAt?.toISOString() ?? null,
    createdAt: app.createdAt.toISOString(),
  };
}

// Totals for the status strip and the filter tabs, from per-stage counts over
// every application (not just the loaded page).
export function summarize(stats: StageStats[]) {
  const count = (stages: Stage[] | null) =>
    stats.filter((s) => !stages || stages.includes(s.stage)).reduce((sum, s) => sum + s.count, 0);
  const total = count(null);
  const scoreSum = stats.reduce((sum, s) => sum + s.scoreSum, 0);
  const scored = stats.reduce((sum, s) => sum + s.scored, 0);
  return {
    total,
    averageFit: scored ? Math.round(scoreSum / scored) : null,
    applied: stats.reduce((sum, s) => sum + s.applied, 0),
    interviewing: count(["interviewing"]),
    offers: count(["offer"]),
    byFilter: Object.fromEntries(STAGE_FILTERS.map((f) => [f, count(stagesFor(f))])) as Record<StageFilter, number>,
  };
}
