import { beforeEach, describe, expect, it } from "vitest";
import type { NewApplication } from "@/domain/application";
import { ProfileSchema } from "@/domain/profile";
import type { Db } from "./client";
import { DrizzleAccountRepository, DrizzleApplicationRepository, DrizzleProfileRepository } from "./repositories";
import { applications, user } from "./schema";
import { openTestDb } from "./testDb";

const profile = ProfileSchema.parse({ personal: { name: "Ada" } });

let db: Db;

async function addUser(id: string) {
  await db.insert(user).values({ id, name: id, email: `${id}@example.com` });
}

const newApp = (userId: string): NewApplication => ({
  userId,
  company: "Acme",
  role: "Engineer",
  jdText: "We need Go",
  job: {
    company: "Acme",
    role: "Engineer",
    location: "",
    responsibilities: [],
    requirements: ["Go"],
    niceToHaves: [],
    techStack: ["Go"],
    yearsRequired: 3,
    cultureSignals: [],
  },
  fit: {
    score: 80,
    requirements: [],
    techStack: [],
    niceToHaves: [],
    experienceLevel: 80,
    domainFit: 50,
    angles: [],
    blockers: [],
  },
  questions: [{ id: "lead", question: "?" }],
  answers: null,
  resume: null,
  typSource: null,
  pdf: null,
  pdfCreatedAt: null,
  coverLetter: null,
  notes: null,
  status: "questions",
  stage: "not_applied",
  stageUpdatedAt: null,
  appliedAt: null,
});

const firstPage = { stage: "all" as const, search: "", limit: 20 };

beforeEach(async () => {
  db = await openTestDb();
  await addUser("alice");
  await addUser("bob");
});

describe("DrizzleProfileRepository", () => {
  it("returns null before a profile is saved", async () => {
    expect(await new DrizzleProfileRepository(db).findByUser("alice")).toBeNull();
  });

  it("upserts one profile per user and keeps users apart", async () => {
    const repo = new DrizzleProfileRepository(db);
    await repo.saveForUser("alice", profile);
    await repo.saveForUser("alice", { ...profile, summary: "updated" });

    expect((await repo.findByUser("alice"))?.profile.summary).toBe("updated");
    expect(await repo.findByUser("bob")).toBeNull();
  });
});

describe("DrizzleApplicationRepository", () => {
  it("round-trips JSON and PDF bytes", async () => {
    const repo = new DrizzleApplicationRepository(db);
    const created = await repo.create(newApp("alice"));
    expect(created.job.techStack).toEqual(["Go"]);

    const updated = await repo.update("alice", created.id, {
      answers: { lead: "Go" },
      pdf: Buffer.from("%PDF-1.7"),
      typSource: "= hi",
      status: "generated",
    });
    expect(updated.answers).toEqual({ lead: "Go" });
    expect(updated.pdf?.toString()).toBe("%PDF-1.7");
  });

  it("never shows one user's applications to another", async () => {
    const repo = new DrizzleApplicationRepository(db);
    const alices = await repo.create(newApp("alice"));

    expect(await repo.findById("bob", alices.id)).toBeNull();
    expect((await repo.listPage("bob", firstPage)).items).toEqual([]);
    expect(await repo.stageStats("bob")).toEqual([]);
    await expect(repo.update("bob", alices.id, { status: "generated" })).rejects.toThrow(/not found/);
    expect((await repo.findById("alice", alices.id))?.status).toBe("questions");
  });
});

describe("listPage", () => {
  // Creates n applications for alice, oldest first; returns their ids.
  async function seed(n: number, over: (i: number) => Partial<NewApplication> = () => ({})) {
    const repo = new DrizzleApplicationRepository(db);
    const ids: number[] = [];
    for (let i = 0; i < n; i++) ids.push((await repo.create({ ...newApp("alice"), ...over(i) })).id);
    return { repo, ids };
  }

  it("pages newest first with a cursor until the end", async () => {
    const { repo, ids } = await seed(5);

    const one = await repo.listPage("alice", { ...firstPage, limit: 2 });
    expect(one.items.map((a) => a.id)).toEqual([ids[4], ids[3]]);
    expect(one.nextCursor).toBe(ids[3]);

    const two = await repo.listPage("alice", { ...firstPage, limit: 2, cursor: one.nextCursor! });
    expect(two.items.map((a) => a.id)).toEqual([ids[2], ids[1]]);

    const last = await repo.listPage("alice", { ...firstPage, limit: 2, cursor: two.nextCursor! });
    expect(last.items.map((a) => a.id)).toEqual([ids[0]]);
    expect(last.nextCursor).toBeNull();
  });

  it("returns only the summary fields the table needs", async () => {
    await seed(1, () => ({ pdf: Buffer.from("%PDF"), appliedAt: new Date("2026-10-01T00:00:00Z") }));
    const [item] = (await new DrizzleApplicationRepository(db).listPage("alice", firstPage)).items;
    expect(item).toEqual({
      id: expect.any(Number),
      role: "Engineer",
      company: "Acme",
      location: "",
      techStack: ["Go"],
      score: 80,
      status: "questions",
      stage: "not_applied",
      appliedAt: new Date("2026-10-01T00:00:00Z"),
      createdAt: expect.any(Date),
    });
  });

  it("lists a tracked job with no fit score", async () => {
    await seed(1, () => ({ status: "tracked", fit: null, notes: "Referral" }));
    const [item] = (await new DrizzleApplicationRepository(db).listPage("alice", firstPage)).items;
    expect(item).toMatchObject({ status: "tracked", score: null });
  });

  it("filters by stage, with closed covering rejected and withdrawn", async () => {
    const stages = ["applied", "rejected", "withdrawn", "offer"] as const;
    const { repo, ids } = await seed(4, (i) => ({ stage: stages[i] }));

    const closed = await repo.listPage("alice", { ...firstPage, stage: "closed" });
    expect(closed.items.map((a) => a.id)).toEqual([ids[2], ids[1]]);
    expect((await repo.listPage("alice", { ...firstPage, stage: "offer" })).items.map((a) => a.id)).toEqual([ids[3]]);
  });

  it("searches role, company, location and stack, case-insensitively", async () => {
    const { repo, ids } = await seed(
      3,
      (i) =>
        [
          { role: "Platform Engineer" },
          { company: "UangAI" },
          { job: { ...newApp("alice").job, location: "Remote, Jakarta", techStack: ["Kotlin", "Spring"] } },
        ][i],
    );
    const find = async (search: string) =>
      (await repo.listPage("alice", { ...firstPage, search })).items.map((a) => a.id);

    expect(await find("platform")).toEqual([ids[0]]);
    expect(await find("uangai")).toEqual([ids[1]]);
    expect(await find("jakarta")).toEqual([ids[2]]);
    expect(await find("kotlin")).toEqual([ids[2]]);
  });

  it("treats % and _ in a search as plain characters", async () => {
    const { repo } = await seed(2, (i) => ({ role: i === 0 ? "100% remote" : "Engineer" }));
    expect((await repo.listPage("alice", { ...firstPage, search: "%" })).items.map((a) => a.role)).toEqual([
      "100% remote",
    ]);
    expect((await repo.listPage("alice", { ...firstPage, search: "_" })).items).toEqual([]);
  });
});

describe("stageStats", () => {
  it("counts each stage with its applied count and fit score total", async () => {
    const repo = new DrizzleApplicationRepository(db);
    const applied = new Date();
    await repo.create({ ...newApp("alice"), stage: "applied", appliedAt: applied });
    await repo.create({ ...newApp("alice"), stage: "applied", appliedAt: applied });
    await repo.create({ ...newApp("alice"), stage: "rejected", appliedAt: applied });
    await repo.create(newApp("alice"));
    await repo.create({ ...newApp("alice"), status: "tracked", fit: null, stage: "applied", appliedAt: applied });
    await repo.create(newApp("bob"));

    const stats = await repo.stageStats("alice");
    expect(stats.sort((a, b) => a.stage.localeCompare(b.stage))).toEqual([
      { stage: "applied", count: 3, applied: 3, scored: 2, scoreSum: 160 },
      { stage: "not_applied", count: 1, applied: 0, scored: 1, scoreSum: 80 },
      { stage: "rejected", count: 1, applied: 1, scored: 1, scoreSum: 80 },
    ]);
  });
});

describe("deleting", () => {
  it("deletes only the owner's application", async () => {
    const repo = new DrizzleApplicationRepository(db);
    const alices = await repo.create(newApp("alice"));

    expect(await repo.delete("bob", alices.id)).toBe(false);
    expect(await repo.findById("alice", alices.id)).not.toBeNull();

    expect(await repo.delete("alice", alices.id)).toBe(true);
    expect(await repo.findById("alice", alices.id)).toBeNull();
  });

  it("removes an account with its profile and applications, leaving others alone", async () => {
    const apps = new DrizzleApplicationRepository(db);
    const profiles = new DrizzleProfileRepository(db);
    await profiles.saveForUser("alice", profile);
    await profiles.saveForUser("bob", profile);
    await apps.create(newApp("alice"));
    const bobs = await apps.create(newApp("bob"));

    await new DrizzleAccountRepository(db).deleteUser("alice");

    expect(await profiles.findByUser("alice")).toBeNull();
    expect((await apps.listPage("alice", firstPage)).items).toEqual([]);
    expect(await profiles.findByUser("bob")).not.toBeNull();
    expect((await apps.findById("bob", bobs.id))?.id).toBe(bobs.id);
  });
});

describe("purgePdfsCreatedBefore", () => {
  it("drops old PDFs but keeps newer ones and the Typst source", async () => {
    const repo = new DrizzleApplicationRepository(db);
    const pdf = Buffer.from("%PDF");
    const old = await repo.create({
      ...newApp("alice"),
      pdf,
      typSource: "= old",
      pdfCreatedAt: new Date("2026-10-01T00:00:00Z"),
    });
    const fresh = await repo.create({
      ...newApp("bob"),
      pdf,
      typSource: "= new",
      pdfCreatedAt: new Date("2026-10-04T00:00:00Z"),
    });

    expect(await repo.purgePdfsCreatedBefore(new Date("2026-10-03T00:00:00Z"))).toBe(1);

    const purged = await repo.findById("alice", old.id);
    expect(purged?.pdf).toBeNull();
    expect(purged?.typSource).toBe("= old");
    expect((await repo.findById("bob", fresh.id))?.pdf?.toString()).toBe("%PDF");
  });
});

describe("older saved analyses", () => {
  it("come back with structured angles and tags", async () => {
    const legacyFit = {
      ...newApp("alice").fit,
      angles: ["Cut latency 90%"],
      requirements: [{ item: "Go", match: "HAVE", evidence: "PGL" }],
    };
    const [row] = await db
      .insert(applications)
      .values({ ...newApp("alice"), fit: legacyFit as never })
      .returning({ id: applications.id });

    const app = await new DrizzleApplicationRepository(db).findById("alice", row.id);
    expect(app?.fit?.angles[0]).toEqual({ title: "", detail: "Cut latency 90%", source: "", jdQuote: "" });
    expect(app?.fit?.requirements[0].tag).toBe("");
  });
});

describe("stage", () => {
  it("defaults to Not applied and stores stage changes", async () => {
    const repo = new DrizzleApplicationRepository(db);
    const app = await repo.create(newApp("alice"));
    expect(app.stage).toBe("not_applied");

    const when = new Date("2026-10-05T09:00:00Z");
    const updated = await repo.update("alice", app.id, {
      stage: "interviewing",
      stageUpdatedAt: when,
      appliedAt: when,
    });
    expect(updated).toMatchObject({ stage: "interviewing", appliedAt: when });
  });
});
