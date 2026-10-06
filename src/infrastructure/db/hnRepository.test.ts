import { beforeEach, describe, expect, it } from "vitest";
import type { HnJob } from "@/domain/hn";
import type { Db } from "./client";
import { DrizzleHnRepository } from "./hnRepository";
import { openTestDb } from "./testDb";

let db: Db;
let repo: DrizzleHnRepository;
const thread = { id: 100, title: "Ask HN: Who is hiring? (October 2026)", postedAt: new Date("2026-10-01T15:00:00Z") };
const at = (h: number) => new Date(`2026-10-01T${String(h).padStart(2, "0")}:00:00Z`);
const job = (over: Partial<HnJob> = {}): HnJob => ({
  company: "Acme",
  role: "Backend Engineer",
  location: "Berlin",
  workMode: "onsite",
  salary: "",
  techStack: ["Go"],
  applyUrl: "",
  ...over,
});

beforeEach(async () => {
  db = await openTestDb();
  repo = new DrizzleHnRepository(db);
  await repo.saveThread(thread);
});

async function seed(n: number) {
  await repo.addPosts(
    Array.from({ length: n }, (_, i) => ({
      id: 200 + i,
      threadId: 100,
      author: `u${i}`,
      postedAt: at(i),
      text: `post ${i}`,
    })),
  );
}

describe("DrizzleHnRepository", () => {
  it("keeps the latest thread and the ids already stored, ignoring duplicates", async () => {
    await seed(3);
    await repo.addPosts([{ id: 200, threadId: 100, author: "u0", postedAt: at(0), text: "again" }]);
    expect(await repo.latestThread()).toEqual(thread);
    expect((await repo.postIds(100)).sort()).toEqual([200, 201, 202]);
    expect((await repo.findPost(200))?.text).toBe("post 0");
  });

  it("hands out unparsed posts and stores parsed results", async () => {
    await seed(3);
    await repo.saveParsed([{ id: 201, job: job() }], at(9));
    expect((await repo.unparsed(10)).map((p) => p.id).sort()).toEqual([200, 202]);
    expect((await repo.findPost(201))?.job).toEqual(job());
  });

  it("pages newest first with a cursor", async () => {
    await seed(5);
    const one = await repo.listPosts(100, { workMode: "all", search: "", limit: 2 });
    expect(one.items.map((p) => p.id)).toEqual([204, 203]);
    const two = await repo.listPosts(100, { workMode: "all", search: "", limit: 2, cursor: one.nextCursor! });
    expect(two.items.map((p) => p.id)).toEqual([202, 201]);
    const last = await repo.listPosts(100, { workMode: "all", search: "", limit: 2, cursor: two.nextCursor! });
    expect(last.items.map((p) => p.id)).toEqual([200]);
    expect(last.nextCursor).toBeNull();
  });

  it("filters by work mode and searches the parsed fields and the post text", async () => {
    await seed(4);
    await repo.saveParsed(
      [
        { id: 200, job: job({ company: "UangAI", workMode: "remote", location: "Remote (APAC)" }) },
        { id: 201, job: job({ role: "Platform Engineer", workMode: "hybrid", techStack: ["Kotlin"] }) },
        { id: 202, job: job({ workMode: "remote" }) },
      ],
      at(9),
    );
    const ids = async (q: { workMode?: "all" | "remote" | "hybrid" | "onsite"; search?: string }) =>
      (await repo.listPosts(100, { workMode: q.workMode ?? "all", search: q.search ?? "", limit: 20 })).items.map(
        (p) => p.id,
      );

    expect(await ids({ workMode: "remote" })).toEqual([202, 200]);
    expect(await ids({ search: "uangai" })).toEqual([200]);
    expect(await ids({ search: "kotlin" })).toEqual([201]);
    expect(await ids({ search: "apac" })).toEqual([200]);
    expect(await ids({ search: "post 3" })).toEqual([203]);
  });
});
