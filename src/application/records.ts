import { createHash } from "node:crypto";
import type { ApplicationRepository, ResumeRenderer } from "@/domain/ports";
import { isPdfExpired, pdfExpiryCutoff } from "@/domain/retention";
import { moveToStage, type Stage } from "@/domain/stage";
import type { Application } from "@/domain/application";

export type RecordsDeps = {
  applications: ApplicationRepository;
  renderer: ResumeRenderer;
  now?: () => Date;
  // Rendered preview pages by content hash; shared across requests by the container.
  previewCache?: Map<string, Buffer[]>;
};

// Enough for a few people looking at a few resumes; each page is roughly 100 KB.
const PREVIEW_CACHE_LIMIT = 20;

export type ResumePreview = { pages: Buffer[]; version: string };

// Stored resumes: serving PDFs, deleting applications, and expiring old PDFs.
// None of this needs Gemini.
export class ApplicationRecords {
  constructor(private readonly deps: RecordsDeps) {}

  private now(): Date {
    return (this.deps.now ?? (() => new Date()))();
  }

  // The stored PDF while it's fresh; after that, rebuilt from the Typst source and not stored again.
  async pdfFor(userId: string, id: number): Promise<{ pdf: Buffer; typSource: string; company: string } | null> {
    const app = await this.deps.applications.findById(userId, id);
    if (!app?.typSource) return null;
    const fresh = app.pdf && !isPdfExpired(app.pdfCreatedAt, this.now());
    const pdf = fresh ? app.pdf! : await this.deps.renderer.compile(app.typSource);
    return { pdf, typSource: app.typSource, company: app.company };
  }

  // Moves the application along the job hunt (Applied, Interviewing, ...).
  async setStage(userId: string, id: number, stage: Stage): Promise<Application | null> {
    const app = await this.deps.applications.findById(userId, id);
    if (!app) return null;
    const next = moveToStage(app, stage, this.now());
    if (next.stage === app.stage) return app;
    return this.deps.applications.update(userId, id, next);
  }

  // Page images for the on-screen viewer, built from the Typst source so they work
  // even after the stored PDF has expired. `version` changes whenever the resume does.
  async previewFor(userId: string, id: number): Promise<ResumePreview | null> {
    const app = await this.deps.applications.findById(userId, id);
    if (!app?.typSource) return null;
    const version = createHash("sha1").update(app.typSource).digest("hex").slice(0, 16);
    const cache = this.deps.previewCache;
    const cached = cache?.get(version);
    if (cached) return { pages: cached, version };

    const pages = await this.deps.renderer.previewPages(app.typSource);
    if (cache) {
      cache.set(version, pages);
      if (cache.size > PREVIEW_CACHE_LIMIT) cache.delete(cache.keys().next().value!);
    }
    return { pages, version };
  }

  async delete(userId: string, id: number): Promise<boolean> {
    return this.deps.applications.delete(userId, id);
  }

  async purgeExpiredPdfs(): Promise<number> {
    return this.deps.applications.purgePdfsCreatedBefore(pdfExpiryCutoff(this.now()));
  }
}
