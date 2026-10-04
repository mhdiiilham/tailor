import { describe, expect, it } from "vitest";
import type { Application } from "@/domain/application";
import type { ApplicationRepository, ResumeRenderer } from "@/domain/ports";
import { PDF_RETENTION_MS } from "@/domain/retention";
import { ApplicationRecords } from "./records";

const now = new Date("2026-10-04T12:00:00Z");

const app = (over: Partial<Application>): Application =>
  ({
    id: 1,
    userId: "alice",
    company: "Acme",
    typSource: "= cv",
    pdf: null,
    pdfCreatedAt: null,
    stage: "not_applied",
    stageUpdatedAt: null,
    appliedAt: null,
    ...over,
  }) as Application;

function setup(stored: Application | null) {
  const compiled: string[] = [];
  const cutoffs: Date[] = [];
  const updates: unknown[] = [];
  const applications = {
    findById: async (userId: string) => (stored && stored.userId === userId ? stored : null),
    update: async (_u: string, _id: number, patch: Partial<Application>) => (updates.push(patch), { ...stored!, ...patch }),
    delete: async () => true,
    purgePdfsCreatedBefore: async (cutoff: Date) => (cutoffs.push(cutoff), 2),
  } as unknown as ApplicationRepository;
  const previews: string[] = [];
  const renderer = {
    compile: async (src: string) => (compiled.push(src), Buffer.from("%PDF-rebuilt")),
    previewPages: async (src: string) => (previews.push(src), [Buffer.from("png-1"), Buffer.from("png-2")]),
  } as unknown as ResumeRenderer;
  const previewCache = new Map<string, Buffer[]>();
  return {
    records: new ApplicationRecords({ applications, renderer, now: () => now, previewCache }),
    compiled,
    cutoffs,
    updates,
    previews,
  };
}

describe("ApplicationRecords.pdfFor", () => {
  it("serves the stored PDF while it is fresh", async () => {
    const { records, compiled } = setup(app({ pdf: Buffer.from("%PDF-stored"), pdfCreatedAt: new Date(now.getTime() - 60_000) }));
    expect((await records.pdfFor("alice", 1))?.pdf.toString()).toBe("%PDF-stored");
    expect(compiled).toEqual([]);
  });

  it("rebuilds from the Typst source once the stored PDF has expired", async () => {
    const expiredAt = new Date(now.getTime() - PDF_RETENTION_MS - 1);
    const { records, compiled } = setup(app({ pdf: Buffer.from("%PDF-stored"), pdfCreatedAt: expiredAt }));
    expect((await records.pdfFor("alice", 1))?.pdf.toString()).toBe("%PDF-rebuilt");
    expect(compiled).toEqual(["= cv"]);
  });

  it("rebuilds when the PDF was already purged", async () => {
    const { records } = setup(app({ pdf: null }));
    expect((await records.pdfFor("alice", 1))?.pdf.toString()).toBe("%PDF-rebuilt");
  });

  it("returns nothing for another user's application", async () => {
    const { records } = setup(app({}));
    expect(await records.pdfFor("bob", 1)).toBeNull();
  });
});

describe("ApplicationRecords.purgeExpiredPdfs", () => {
  it("purges PDFs older than the retention window", async () => {
    const { records, cutoffs } = setup(null);
    expect(await records.purgeExpiredPdfs()).toBe(2);
    expect(cutoffs[0]).toEqual(new Date(now.getTime() - PDF_RETENTION_MS));
  });
});

describe("ApplicationRecords.setStage", () => {
  it("moves the stage and records when it applied", async () => {
    const { records } = setup(app({}));
    expect(await records.setStage("alice", 1, "applied")).toMatchObject({ stage: "applied", appliedAt: now, stageUpdatedAt: now });
  });

  it("skips the write when the stage is unchanged", async () => {
    const { records, updates } = setup(app({ stage: "applied" }));
    await records.setStage("alice", 1, "applied");
    expect(updates).toEqual([]);
  });

  it("returns nothing for another user's application", async () => {
    const { records } = setup(app({}));
    expect(await records.setStage("bob", 1, "offer")).toBeNull();
  });
});

describe("ApplicationRecords.previewFor", () => {
  it("renders the pages once and serves repeats from the cache", async () => {
    const { records, previews } = setup(app({}));
    const first = await records.previewFor("alice", 1);
    const second = await records.previewFor("alice", 1);
    expect(first?.pages.map(String)).toEqual(["png-1", "png-2"]);
    expect(second?.version).toBe(first?.version);
    expect(previews).toEqual(["= cv"]);
  });

  it("has a new version when the resume changes", async () => {
    const a = await setup(app({ typSource: "= one" })).records.previewFor("alice", 1);
    const b = await setup(app({ typSource: "= two" })).records.previewFor("alice", 1);
    expect(a?.version).not.toBe(b?.version);
  });

  it("returns nothing without a resume or for another user", async () => {
    expect(await setup(app({ typSource: null })).records.previewFor("alice", 1)).toBeNull();
    expect(await setup(app({})).records.previewFor("bob", 1)).toBeNull();
  });
});
