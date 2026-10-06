import "server-only";
import { hnRepository } from "@/container";
import { HN_PAGE_SIZE, toHnRow, type HnRowPage, type WorkModeFilter } from "./rows";

// One page of the current thread's posts, for the page itself and for "Load more".
export async function loadHnPage(
  threadId: number,
  workMode: WorkModeFilter,
  search: string,
  cursor?: string,
): Promise<HnRowPage> {
  const page = await hnRepository().listPosts(threadId, { workMode, search, cursor, limit: HN_PAGE_SIZE });
  return { rows: page.items.map(toHnRow), nextCursor: page.nextCursor };
}
