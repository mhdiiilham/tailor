import { HnJobBatchSchema, hnText, isHiringThread, safeUrl, type HnJob } from "@/domain/hn";
import type { HnClient, HnRepository, HnThread, LlmPort } from "@/domain/ports";
import { HN_PARSE_SYSTEM } from "@/prompts/hn";

const BATCH_SIZE = 20;
const MAX_PARSE_PER_RUN = 300;
const FETCH_CONCURRENCY = 8;
const MAX_POST_CHARS = 4_000; // a few posts are essays; this caps the tokens one can cost

export type HnSyncDeps = {
  hn: HnClient;
  repo: HnRepository;
  // Gemini Flash-Lite with the server's own key; null when GEMINI_API_KEY isn't set.
  llm: LlmPort | null;
  // HN_HIRING_THREAD_ID: pins a thread. Otherwise the latest one from "whoishiring".
  threadId?: number;
  now?: () => Date;
  log?: (message: string) => void;
};

// Keeps the stored "Who is hiring?" posts up to date. Each run fetches only posts it
// hasn't seen, and parses each post once; nothing is re-read from the start.
export class HnSync {
  constructor(private readonly deps: HnSyncDeps) {}

  async run(): Promise<{ thread: number | null; added: number; parsed: number }> {
    const thread = await this.currentThread();
    if (!thread) return { thread: null, added: 0, parsed: 0 };
    await this.deps.repo.saveThread(thread);
    const added = await this.addNewPosts(thread.id);
    await this.deps.repo.markChecked(thread.id, this.now());
    const parsed = await this.parsePending();
    return { thread: thread.id, added, parsed };
  }

  private now() {
    return (this.deps.now ?? (() => new Date()))();
  }

  private async currentThread(): Promise<HnThread | null> {
    const { hn, threadId } = this.deps;
    if (threadId) return toThread(await hn.item(threadId));
    // whoishiring posts "Who is hiring?" and "Who wants to be hired?" together each month.
    for (const id of (await hn.submissions("whoishiring")).slice(0, 6)) {
      const item = await hn.item(id);
      if (item?.title && isHiringThread(item.title)) return toThread(item);
    }
    return null;
  }

  private async addNewPosts(threadId: number): Promise<number> {
    const { hn, repo } = this.deps;
    const kids = (await hn.item(threadId))?.kids ?? [];
    const known = new Set(await repo.postIds(threadId));
    const fresh = kids.filter((id) => !known.has(id));

    const items = await mapLimit(fresh, FETCH_CONCURRENCY, (id) => hn.item(id).catch(() => null));
    const posts = items
      .filter((i) => i && i.type === "comment" && !i.deleted && !i.dead && i.text && i.time)
      .map((i) => ({
        id: i!.id,
        threadId,
        author: i!.by ?? "",
        postedAt: new Date(i!.time! * 1000),
        text: hnText(i!.text!),
      }));
    await repo.addPosts(posts);
    return posts.length;
  }

  private async parsePending(): Promise<number> {
    const { llm, repo } = this.deps;
    if (!llm) return 0;
    const pending = await repo.unparsed(MAX_PARSE_PER_RUN);
    let parsed = 0;
    for (let i = 0; i < pending.length; i += BATCH_SIZE) {
      const batch = pending.slice(i, i + BATCH_SIZE);
      let result;
      try {
        result = await llm.generateObject({
          tier: "fast",
          schema: HnJobBatchSchema,
          system: HN_PARSE_SYSTEM,
          prompt: batch.map((p) => `POST ${p.id}:\n${p.text.slice(0, MAX_POST_CHARS)}`).join("\n\n---\n\n"),
        });
      } catch (err) {
        // Usually a rate limit; the rest waits for the next run.
        this.deps.log?.(`[hn] parsing stopped: ${err instanceof Error ? err.message : String(err)}`);
        break;
      }
      const ids = new Set(batch.map((p) => p.id));
      const jobs = result.posts.filter((p) => ids.has(p.id)).map(({ id, ...job }) => ({ id, job: clean(job) }));
      await repo.saveParsed(jobs, this.now());
      parsed += jobs.length;
    }
    return parsed;
  }
}

function toThread(item: { id: number; title?: string; time?: number } | null): HnThread | null {
  if (!item?.title || !item.time) return null;
  return { id: item.id, title: item.title, postedAt: new Date(item.time * 1000) };
}

function clean(job: HnJob): HnJob {
  return {
    ...job,
    techStack: [...new Set(job.techStack.map((t) => t.trim()).filter(Boolean))],
    applyUrl: safeUrl(job.applyUrl),
  };
}

// Like Promise.all over a map, with at most `limit` calls in flight.
async function mapLimit<T, R>(values: T[], limit: number, fn: (value: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(values.length);
  let next = 0;
  const worker = async () => {
    while (next < values.length) {
      const index = next++;
      results[index] = await fn(values[index]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, worker));
  return results;
}
