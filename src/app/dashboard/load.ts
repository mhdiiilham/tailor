import "server-only";
import { applicationRepository } from "@/container";
import type { StageFilter } from "@/domain/stage";
import { PAGE_SIZE, toRow, type RowPage } from "./rows";

// One page of the applications list, used by the page itself and by "Load more".
export async function loadRowPage(
  userId: string,
  stage: StageFilter,
  search: string,
  cursor?: number,
): Promise<RowPage> {
  const page = await applicationRepository().listPage(userId, { stage, search, cursor, limit: PAGE_SIZE });
  return { rows: page.items.map(toRow), nextCursor: page.nextCursor };
}
