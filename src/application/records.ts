import type { ApplicationRepository, ResumeRenderer } from "@/domain/ports";
import { isPdfExpired, pdfExpiryCutoff } from "@/domain/retention";
import { moveToStage, type Stage } from "@/domain/stage";
import type { Application } from "@/domain/application";

export type RecordsDeps = {
  applications: ApplicationRepository;
  renderer: ResumeRenderer;
  now?: () => Date;
};

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

  async delete(userId: string, id: number): Promise<boolean> {
    return this.deps.applications.delete(userId, id);
  }

  async purgeExpiredPdfs(): Promise<number> {
    return this.deps.applications.purgePdfsCreatedBefore(pdfExpiryCutoff(this.now()));
  }
}
