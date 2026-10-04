import type { Application, ApplicationStatus } from "@/domain/application";

// What the dashboard table needs, serializable for the client component.
export type ApplicationRow = {
  id: number;
  role: string;
  company: string;
  location: string;
  stack: string[];
  score: number;
  status: ApplicationStatus;
  createdAt: string;
};

export type StatusFilter = "all" | ApplicationStatus;

export function toRow(app: Application): ApplicationRow {
  return {
    id: app.id,
    role: app.role,
    company: app.company,
    location: app.job.location,
    stack: app.job.techStack.slice(0, 4),
    score: app.fit.score,
    status: app.status,
    createdAt: app.createdAt.toISOString(),
  };
}

// Case-insensitive search over role, company, location and stack.
export function filterRows(rows: ApplicationRow[], query: string, status: StatusFilter): ApplicationRow[] {
  const q = query.trim().toLowerCase();
  return rows.filter((r) => {
    if (status !== "all" && r.status !== status) return false;
    if (!q) return true;
    return [r.role, r.company, r.location, ...r.stack].some((v) => v.toLowerCase().includes(q));
  });
}

export function summarize(rows: ApplicationRow[]) {
  const ready = rows.filter((r) => r.status === "generated").length;
  const averageFit = rows.length ? Math.round(rows.reduce((sum, r) => sum + r.score, 0) / rows.length) : null;
  return { total: rows.length, ready, waiting: rows.length - ready, averageFit };
}
