import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import type { NewApplication } from "@/domain/application";
import { ProfileSchema } from "@/domain/profile";
import { openDb, type Db } from "./client";
import { DrizzleApplicationRepository, DrizzleProfileRepository } from "./repositories";
import { user } from "./schema";

const profile = ProfileSchema.parse({ personal: { name: "Ada" } });

let db: Db;

function addUser(id: string) {
  const now = new Date();
  db.insert(user).values({ id, name: id, email: `${id}@example.com`, createdAt: now, updatedAt: now }).run();
}

const newApp = (userId: string): NewApplication => ({
  userId,
  company: "Acme",
  role: "Engineer",
  jdText: "We need Go",
  job: {
    company: "Acme", role: "Engineer", location: "", responsibilities: [], requirements: ["Go"],
    niceToHaves: [], techStack: ["Go"], yearsRequired: 3, cultureSignals: [],
  },
  fit: {
    score: 80, requirements: [], techStack: [], niceToHaves: [], experienceLevel: 80,
    domainFit: 50, angles: [], blockers: [],
  },
  questions: [{ id: "lead", question: "?" }],
  answers: null,
  resume: null,
  typSource: null,
  pdf: null,
  status: "questions",
});

beforeEach(() => {
  db = openDb(path.join(mkdtempSync(path.join(tmpdir(), "db-")), "test.db"));
  addUser("alice");
  addUser("bob");
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
    expect(await repo.list("bob")).toEqual([]);
    await expect(repo.update("bob", alices.id, { status: "generated" })).rejects.toThrow(/not found/);
    expect((await repo.findById("alice", alices.id))?.status).toBe("questions");
  });
});
