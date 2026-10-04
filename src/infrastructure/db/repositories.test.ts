import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import type { NewApplication } from "@/domain/application";
import { ProfileSchema } from "@/domain/profile";
import { openDb, type Db } from "./client";
import { DrizzleApplicationRepository, DrizzleProfileRepository } from "./repositories";

const profile = ProfileSchema.parse({ personal: { name: "Ada" } });

let db: Db;
beforeEach(() => {
  db = openDb(path.join(mkdtempSync(path.join(tmpdir(), "db-")), "test.db"));
});

describe("DrizzleProfileRepository", () => {
  it("returns null before a profile is saved", async () => {
    expect(await new DrizzleProfileRepository(db).findDefault()).toBeNull();
  });

  it("creates then updates the same default profile", async () => {
    const repo = new DrizzleProfileRepository(db);
    const first = await repo.saveDefault(profile);
    const second = await repo.saveDefault({ ...profile, summary: "updated" });
    expect(second.id).toBe(first.id);
    expect((await repo.findDefault())?.profile.summary).toBe("updated");
  });
});

describe("DrizzleApplicationRepository", () => {
  it("round-trips JSON columns and updates", async () => {
    const { id: profileId } = await new DrizzleProfileRepository(db).saveDefault(profile);
    const repo = new DrizzleApplicationRepository(db);
    const app: NewApplication = {
      profileId,
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
      pdfPath: null,
      status: "questions",
    };
    const created = await repo.create(app);
    expect(created.job.techStack).toEqual(["Go"]);
    expect(created.createdAt).toBeInstanceOf(Date);

    const updated = await repo.update(created.id, { answers: { lead: "Go" }, status: "generated" });
    expect(updated.answers).toEqual({ lead: "Go" });
    expect((await repo.list()).map((a) => a.id)).toEqual([created.id]);
  });
});
