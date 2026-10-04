import type { Application, ApplicationStatus } from "@/domain/application";
import { CLOSED_STAGES, type Stage } from "@/domain/stage";

// What the dashboard table needs, serializable for the client component.
export type ApplicationRow = {
  id: number;
  role: string;
  company: string;
  location: string;
  stack: string[];
  score: number;
  status: ApplicationStatus;
  stage: Stage;
  appliedAt: string | null;
  createdAt: string;
};

// Rejected and Withdrawn are grouped as "closed" for filtering.
export type StageFilter = "all" | "closed" | Exclude<Stage, "rejected" | "withdrawn">;

export function toRow(app: Application): ApplicationRow {
  return {
    id: app.id,
    role: app.role,
    company: app.company,
    location: app.job.location,
    stack: app.job.techStack.slice(0, 4),
    score: app.fit.score,
    status: app.status,
    stage: app.stage,
    appliedAt: app.appliedAt?.toISOString() ?? null,
    createdAt: app.createdAt.toISOString(),
  };
}

export function matchesStage(row: ApplicationRow, filter: StageFilter): boolean {
  if (filter === "all") return true;
  if (filter === "closed") return CLOSED_STAGES.includes(row.stage);
  return row.stage === filter;
}

// Case-insensitive search over role, company, location and stack.
export function filterRows(rows: ApplicationRow[], query: string, filter: StageFilter): ApplicationRow[] {
  const q = query.trim().toLowerCase();
  return rows.filter((r) => {
    if (!matchesStage(r, filter)) return false;
    if (!q) return true;
    return [r.role, r.company, r.location, ...r.stack].some((v) => v.toLowerCase().includes(q));
  });
}

export function summarize(rows: ApplicationRow[]) {
  const averageFit = rows.length ? Math.round(rows.reduce((sum, r) => sum + r.score, 0) / rows.length) : null;
  return {
    total: rows.length,
    averageFit,
    applied: rows.filter((r) => r.appliedAt !== null).length,
    interviewing: rows.filter((r) => r.stage === "interviewing").length,
    offers: rows.filter((r) => r.stage === "offer").length,
  };
}
