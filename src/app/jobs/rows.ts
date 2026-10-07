import { WORK_MODES, type HnJob, type HnPost, type WorkMode } from "@/domain/hn";

// One HN post as the page needs it, serializable for the client component.
export type HnPostRow = {
  id: number;
  author: string;
  postedAt: string;
  text: string;
  job: HnJob | null;
  saved: boolean; // saved by the signed-in user
};
export type HnRowPage = { rows: HnPostRow[]; nextCursor: string | null };
export type WorkModeFilter = WorkMode | "all";
// Where a list comes from: one month's thread (its HN id), or the user's saved posts.
export type HnSource = number | "saved";

export const HN_PAGE_SIZE = 20;

export const toHnRow = (p: HnPost, saved: boolean): HnPostRow => ({
  id: p.id,
  author: p.author,
  postedAt: p.postedAt.toISOString(),
  text: p.text,
  job: p.job,
  saved,
});

// Anything unknown (e.g. a hand-edited URL) falls back to "all".
export function parseWorkMode(raw: unknown): WorkModeFilter {
  return WORK_MODES.find((m) => m === raw && m !== "unknown") ?? "all";
}
