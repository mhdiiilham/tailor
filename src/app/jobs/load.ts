import "server-only";
import { hnRepository } from "@/container";
import { HN_PAGE_SIZE, toHnRow, type HnRowPage, type HnSource, type WorkModeFilter } from "./rows";

// One page of posts, from a month's thread or from the user's saved posts, each marked
// with whether this user saved it. Used by the page itself and by "Load more".
// userId is null for signed-out visitors: they see posts but have nothing saved.
export async function loadHnPage(
  userId: string | null,
  source: HnSource,
  workMode: WorkModeFilter,
  search: string,
  cursor?: string,
): Promise<HnRowPage> {
  const repo = hnRepository();
  const query = { workMode, search, cursor, limit: HN_PAGE_SIZE };
  if (source === "saved") {
    if (!userId) return { rows: [], nextCursor: null };
    const page = await repo.listSaved(userId, query);
    return { rows: page.items.map((p) => toHnRow(p, true)), nextCursor: page.nextCursor };
  }
  const page = await repo.listPosts(source, query);
  const ids = page.items.map((p) => p.id);
  const saved = new Set(userId ? await repo.savedIds(userId, ids) : []);
  return { rows: page.items.map((p) => toHnRow(p, saved.has(p.id))), nextCursor: page.nextCursor };
}
