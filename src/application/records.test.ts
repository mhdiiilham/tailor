import { describe, expect, it } from "vitest";
import type { Application } from "@/domain/application";
import type { ApplicationRepository, ResumeRenderer } from "@/domain/ports";
import { PDF_RETENTION_MS } from "@/domain/retention";
import { ApplicationRecords } from "./records";

const now = new Date("2026-10-04T12:00:00Z");

const app = (over: Partial<Application>): Application =>
  ({ id: 1, userId: "alice", company: "Acme", typSource: "= cv", pdf: null, pdfCreatedAt: null, ...over }) as Application;

function setup(stored: Application | null) {
  const compiled: string[] = [];
  const cutoffs: Date[] = [];
  const applications = {
    findById: async (userId: string) => (stored && stored.userId === userId ? stored : null),
    delete: async () => true,
    purgePdfsCreatedBefore: async (cutoff: Date) => (cutoffs.push(cutoff), 2),
  } as unknown as ApplicationRepository;
  const renderer = {
    compile: async (src: string) => (compiled.push(src), Buffer.from("%PDF-rebuilt")),
  } as unknown as ResumeRenderer;
  return { records: new ApplicationRecords({ applications, renderer, now: () => now }), compiled, cutoffs };
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
