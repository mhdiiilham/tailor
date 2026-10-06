import "server-only";
import { hnRepository } from "@/container";
import { HN_PAGE_SIZE, toHnRow, type HnRowPage, type HnSource, type WorkModeFilter } from "./rows";

// One page of posts, from a month's thread or from the user's saved posts, each marked
// with whether this user saved it. Used by the page itself and by "Load more".
export async function loadHnPage(
  userId: string,
  source: HnSource,
  workMode: WorkModeFilter,
  search: string,
  cursor?: string,
): Promise<HnRowPage> {
  const repo = hnRepository();
  const query = { workMode, search, cursor, limit: HN_PAGE_SIZE };
  const page = source === "saved" ? await repo.listSaved(userId, query) : await repo.listPosts(source, query);
  const saved =
    source === "saved"
      ? new Set(page.items.map((p) => p.id))
      : new Set(
          await repo.savedIds(
            userId,
            page.items.map((p) => p.id),
          ),
        );
  return { rows: page.items.map((p) => toHnRow(p, saved.has(p.id))), nextCursor: page.nextCursor };
}
