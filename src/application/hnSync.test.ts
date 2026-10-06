import { describe, expect, it } from "vitest";
import type { HnJob, HnPost } from "@/domain/hn";
import type { HnClient, HnItem, HnRepository, HnThread } from "@/domain/ports";
import { FakeLlm } from "@/infrastructure/llm/fakeLlm";
import { HnSync } from "./hnSync";

const THREAD: HnItem = {
  id: 100,
  type: "story",
  title: "Ask HN: Who is hiring? (October 2026)",
  time: 1790866927,
  kids: [],
};

class FakeHn implements HnClient {
  fetched: number[] = [];
  constructor(
    private items: Record<number, HnItem>,
    private submitted: number[] = [],
  ) {}
  async item(id: number) {
    this.fetched.push(id);
    return this.items[id] ?? null;
  }
  async submissions() {
    return this.submitted;
  }
}

class MemoryHn implements HnRepository {
  threads: HnThread[] = [];
  posts = new Map<number, HnPost>();
  checked: number[] = [];
  async saveThread(t: HnThread) {
    if (!this.threads.some((x) => x.id === t.id)) this.threads.push(t);
  }
  async latestThread() {
    return this.threads.at(-1) ?? null;
  }
  async listThreads() {
    return [...this.threads].reverse();
  }
  async markChecked(id: number) {
    this.checked.push(id);
  }
  async postIds(threadId: number) {
    return [...this.posts.values()].filter((p) => p.threadId === threadId).map((p) => p.id);
  }
  async addPosts(posts: Omit<HnPost, "job">[]) {
    for (const p of posts) if (!this.posts.has(p.id)) this.posts.set(p.id, { ...p, job: null });
  }
  async unparsed(limit: number) {
    return [...this.posts.values()].filter((p) => !p.job).slice(0, limit);
  }
  async saveParsed(results: { id: number; job: HnJob }[]) {
    for (const r of results) this.posts.set(r.id, { ...this.posts.get(r.id)!, job: r.job });
  }
  async listPosts(): Promise<never> {
    throw new Error("not used");
  }
  async findPost(): Promise<never> {
    throw new Error("not used");
  }
  async savePost(): Promise<never> {
    throw new Error("not used");
  }
  async unsavePost(): Promise<never> {
    throw new Error("not used");
  }
  async savedIds(): Promise<never> {
    throw new Error("not used");
  }
  async savedCount(): Promise<never> {
    throw new Error("not used");
  }
  async listSaved(): Promise<never> {
    throw new Error("not used");
  }
}

const post = (id: number, text = `Acme | Engineer | REMOTE ${id}`): HnItem => ({
  id,
  type: "comment",
  by: `user${id}`,
  time: 1790867000 + id,
  text,
});

const parsed = (id: number, over: Partial<HnJob> = {}) => ({
  id,
  company: "Acme",
  role: "Engineer",
  location: "",
  workMode: "remote" as const,
  salary: "",
  techStack: ["Go"],
  applyUrl: "https://acme.com/jobs",
  ...over,
});

describe("HnSync", () => {
  it("finds the current hiring thread through the whoishiring account", async () => {
    const hn = new FakeHn(
      { 101: { id: 101, type: "story", title: "Ask HN: Who wants to be hired? (October 2026)" }, 100: THREAD },
      [101, 100, 50],
    );
    const repo = new MemoryHn();
    await new HnSync({ hn, repo, llm: null }).run();
    expect(repo.threads.map((t) => t.id)).toEqual([100]);
  });

  it("uses the configured thread id when one is set", async () => {
    const hn = new FakeHn({ 777: { ...THREAD, id: 777 } });
    const repo = new MemoryHn();
    await new HnSync({ hn, repo, llm: null, threadId: 777 }).run();
    expect(repo.threads.map((t) => t.id)).toEqual([777]);
  });

  it("fetches only posts it hasn't stored yet, skipping deleted and flagged ones", async () => {
    const items: Record<number, HnItem> = {
      100: { ...THREAD, kids: [1, 2, 3, 4] },
      1: post(1),
      2: { id: 2, type: "comment", deleted: true },
      3: { ...post(3), dead: true },
      4: post(4, 'Beta | Designer<p>See <a href="https:&#x2F;&#x2F;beta.io">beta.io</a>'),
    };
    const hn = new FakeHn(items);
    const repo = new MemoryHn();
    await repo.saveThread({ id: 100, title: THREAD.title!, postedAt: new Date() });
    await repo.addPosts([{ id: 1, threadId: 100, author: "user1", postedAt: new Date(), text: "already here" }]);

    const result = await new HnSync({ hn, repo, llm: null, threadId: 100 }).run();

    expect(hn.fetched.filter((id) => id !== 100).sort()).toEqual([2, 3, 4]);
    expect([...repo.posts.keys()].sort()).toEqual([1, 4]);
    expect(repo.posts.get(4)?.text).toBe("Beta | Designer\n\nSee https://beta.io");
    expect(result).toMatchObject({ added: 1 });
    expect(repo.checked).toEqual([100]);
  });

  it("parses new posts with the fast model in batches, keeping only safe links", async () => {
    const kids = Array.from({ length: 25 }, (_, i) => i + 1);
    const items: Record<number, HnItem> = { 100: { ...THREAD, kids } };
    for (const id of kids) items[id] = post(id);
    const llm = new FakeLlm([
      { posts: kids.slice(0, 20).map((id) => parsed(id, id === 1 ? { applyUrl: "javascript:alert(1)" } : {})) },
      { posts: kids.slice(20).map((id) => parsed(id)) },
    ]);
    const repo = new MemoryHn();

    const result = await new HnSync({ hn: new FakeHn(items), repo, llm, threadId: 100 }).run();

    expect(llm.requests).toHaveLength(2);
    expect(llm.requests.every((r) => r.tier === "fast")).toBe(true);
    expect(llm.requests[0].prompt).toContain("POST 1:");
    expect(result.parsed).toBe(25);
    expect(repo.posts.get(1)?.job?.applyUrl).toBe("");
    expect(repo.posts.get(2)?.job?.applyUrl).toBe("https://acme.com/jobs");
  });

  it("ignores results for posts that weren't in the batch", async () => {
    const llm = new FakeLlm([{ posts: [parsed(1), parsed(999)] }]);
    const repo = new MemoryHn();
    await new HnSync({ hn: new FakeHn({ 100: { ...THREAD, kids: [1] }, 1: post(1) }), repo, llm, threadId: 100 }).run();
    expect([...repo.posts.keys()]).toEqual([1]);
    expect(repo.posts.get(1)?.job?.company).toBe("Acme");
  });

  it("stops parsing for this run when Gemini fails, leaving posts for next time", async () => {
    const llm = new FakeLlm([]); // throws: no queued response
    const repo = new MemoryHn();
    const result = await new HnSync({
      hn: new FakeHn({ 100: { ...THREAD, kids: [1] }, 1: post(1) }),
      repo,
      llm,
      threadId: 100,
    }).run();
    expect(result).toMatchObject({ added: 1, parsed: 0 });
    expect(repo.posts.get(1)?.job).toBeNull();
  });
});
