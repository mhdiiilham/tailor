import { execFile } from "node:child_process";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import type { RenderedResume, ResumeRenderer } from "@/domain/ports";
import { renderResumeTypst } from "./typstResume";

const run = promisify(execFile);

// Sharp on high-density screens without making each page image huge.
const PREVIEW_PPI = 144;

// Compiles in a throwaway temp folder and returns the bytes; nothing stays on disk.
export class TypstResumeRenderer implements ResumeRenderer {
  constructor(private readonly typstBin = "typst") {}

  async render({ profile, resume }: Parameters<ResumeRenderer["render"]>[0]): Promise<RenderedResume> {
    const typSource = renderResumeTypst(profile, resume);
    return { typSource, pdf: await this.compile(typSource) };
  }

  async compile(typSource: string): Promise<Buffer> {
    return this.inTempDir(typSource, async (dir, typPath) => {
      const pdfPath = path.join(dir, "resume.pdf");
      await run(this.typstBin, ["compile", typPath, pdfPath]);
      return readFile(pdfPath);
    });
  }

  // One PNG per page, in order, for the on-screen preview.
  async previewPages(typSource: string): Promise<Buffer[]> {
    return this.inTempDir(typSource, async (dir, typPath) => {
      await run(this.typstBin, ["compile", "--format", "png", "--ppi", String(PREVIEW_PPI), typPath, path.join(dir, "page-{0p}.png")]);
      const pages = (await readdir(dir)).filter((f) => f.startsWith("page-") && f.endsWith(".png")).sort();
      return Promise.all(pages.map((f) => readFile(path.join(dir, f))));
    });
  }

  private async inTempDir<T>(typSource: string, work: (dir: string, typPath: string) => Promise<T>): Promise<T> {
    const dir = await mkdtemp(path.join(tmpdir(), "tailor-"));
    const typPath = path.join(dir, "resume.typ");
    try {
      await writeFile(typPath, typSource, "utf8");
      return await work(dir, typPath);
    } catch (err) {
      const stderr = (err as { stderr?: string }).stderr ?? String(err);
      throw new Error(`typst compile failed:\n${stderr}`);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }
}
