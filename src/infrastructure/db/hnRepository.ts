import { and, desc, eq, ilike, isNull, or, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import type { HnJob, HnPost, HnPostPage, HnPostQuery } from "@/domain/hn";
import type { HnRepository, HnThread } from "@/domain/ports";
import type { Db } from "./client";
import { containsPattern } from "./like";
import { hnPosts, hnThreads } from "./schema";

// Cursor for newest-first paging on (posted time, id), opaque to callers.
const CursorSchema = z.object({ t: z.string().datetime(), i: z.number().int().positive() });
const encodeCursor = (p: { postedAt: Date; id: number }) =>
  Buffer.from(JSON.stringify({ t: p.postedAt.toISOString(), i: p.id })).toString("base64url");

function decodeCursor(cursor: string) {
  try {
    return CursorSchema.parse(JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")));
  } catch {
    throw new Error("Invalid page. Reload the list and try again.");
  }
}

export class DrizzleHnRepository implements HnRepository {
  constructor(private readonly db: Db) {}

  async saveThread(thread: HnThread): Promise<void> {
    await this.db
      .insert(hnThreads)
      .values(thread)
      .onConflictDoUpdate({ target: hnThreads.id, set: { title: thread.title } });
  }

  async latestThread(): Promise<HnThread | null> {
    const [row] = await this.db
      .select({ id: hnThreads.id, title: hnThreads.title, postedAt: hnThreads.postedAt })
      .from(hnThreads)
      .orderBy(desc(hnThreads.postedAt))
      .limit(1);
    return row ?? null;
  }

  async listThreads(): Promise<HnThread[]> {
    return this.db
      .select({ id: hnThreads.id, title: hnThreads.title, postedAt: hnThreads.postedAt })
      .from(hnThreads)
      .orderBy(desc(hnThreads.postedAt));
  }

  async markChecked(threadId: number, at: Date): Promise<void> {
    await this.db.update(hnThreads).set({ checkedAt: at }).where(eq(hnThreads.id, threadId));
  }

  async postIds(threadId: number): Promise<number[]> {
    const rows = await this.db.select({ id: hnPosts.id }).from(hnPosts).where(eq(hnPosts.threadId, threadId));
    return rows.map((r) => r.id);
  }

  async addPosts(posts: Omit<HnPost, "job">[]): Promise<void> {
    if (posts.length === 0) return;
    await this.db.insert(hnPosts).values(posts).onConflictDoNothing();
  }

  async unparsed(limit: number): Promise<{ id: number; text: string }[]> {
    return this.db
      .select({ id: hnPosts.id, text: hnPosts.text })
      .from(hnPosts)
      .where(isNull(hnPosts.job))
      .orderBy(desc(hnPosts.postedAt))
      .limit(limit);
  }

  async saveParsed(results: { id: number; job: HnJob }[], at: Date): Promise<void> {
    for (const { id, job } of results) {
      await this.db.update(hnPosts).set({ job, parsedAt: at }).where(eq(hnPosts.id, id));
    }
  }

  async listPosts(threadId: number, { workMode, search, cursor, limit }: HnPostQuery): Promise<HnPostPage> {
    const where: SQL[] = [eq(hnPosts.threadId, threadId)];
    if (workMode !== "all") where.push(sql`${hnPosts.job}->>'workMode' = ${workMode}`);
    const query = search.trim();
    if (query) {
      const pattern = containsPattern(query);
      where.push(
        or(
          ilike(hnPosts.text, pattern),
          sql`${hnPosts.job}->>'company' ilike ${pattern}`,
          sql`${hnPosts.job}->>'role' ilike ${pattern}`,
          sql`${hnPosts.job}->>'location' ilike ${pattern}`,
          sql`(${hnPosts.job}->'techStack')::text ilike ${pattern}`,
        )!,
      );
    }
    if (cursor) {
      const after = decodeCursor(cursor);
      where.push(sql`(${hnPosts.postedAt}, ${hnPosts.id}) < (${after.t}::timestamptz, ${after.i}::int)`);
    }

    const rows = await this.db
      .select({
        id: hnPosts.id,
        threadId: hnPosts.threadId,
        author: hnPosts.author,
        postedAt: hnPosts.postedAt,
        text: hnPosts.text,
        job: hnPosts.job,
      })
      .from(hnPosts)
      .where(and(...where))
      .orderBy(desc(hnPosts.postedAt), desc(hnPosts.id))
      .limit(limit + 1);

    const items = rows.slice(0, limit);
    return { items, nextCursor: rows.length > limit ? encodeCursor(items[items.length - 1]) : null };
  }

  async findPost(id: number): Promise<HnPost | null> {
    const [row] = await this.db
      .select({
        id: hnPosts.id,
        threadId: hnPosts.threadId,
        author: hnPosts.author,
        postedAt: hnPosts.postedAt,
        text: hnPosts.text,
        job: hnPosts.job,
      })
      .from(hnPosts)
      .where(eq(hnPosts.id, id));
    return row ?? null;
  }
}
