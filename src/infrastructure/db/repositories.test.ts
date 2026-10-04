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
  pdfCreatedAt: null,
  status: "questions",
});

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
    expect(await repo.list("bob")).toEqual([]);
    await expect(repo.update("bob", alices.id, { status: "generated" })).rejects.toThrow(/not found/);
    expect((await repo.findById("alice", alices.id))?.status).toBe("questions");
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
    expect(await apps.list("alice")).toEqual([]);
    expect(await profiles.findByUser("bob")).not.toBeNull();
    expect((await apps.findById("bob", bobs.id))?.id).toBe(bobs.id);
  });
});

describe("purgePdfsCreatedBefore", () => {
  it("drops old PDFs but keeps newer ones and the Typst source", async () => {
    const repo = new DrizzleApplicationRepository(db);
    const pdf = Buffer.from("%PDF");
    const old = await repo.create({ ...newApp("alice"), pdf, typSource: "= old", pdfCreatedAt: new Date("2026-10-01T00:00:00Z") });
    const fresh = await repo.create({ ...newApp("bob"), pdf, typSource: "= new", pdfCreatedAt: new Date("2026-10-04T00:00:00Z") });

    expect(await repo.purgePdfsCreatedBefore(new Date("2026-10-03T00:00:00Z"))).toBe(1);

    const purged = await repo.findById("alice", old.id);
    expect(purged?.pdf).toBeNull();
    expect(purged?.typSource).toBe("= old");
    expect((await repo.findById("bob", fresh.id))?.pdf?.toString()).toBe("%PDF");
  });
});

describe("older saved analyses", () => {
  it("come back with structured angles and tags", async () => {
    const legacyFit = { ...newApp("alice").fit, angles: ["Cut latency 90%"], requirements: [{ item: "Go", match: "HAVE", evidence: "PGL" }] };
    const [row] = await db
      .insert(applications)
      .values({ ...newApp("alice"), fit: legacyFit as never })
      .returning({ id: applications.id });

    const app = await new DrizzleApplicationRepository(db).findById("alice", row.id);
    expect(app?.fit.angles[0]).toEqual({ title: "", detail: "Cut latency 90%", source: "", jdQuote: "" });
    expect(app?.fit.requirements[0].tag).toBe("");
  });
});
