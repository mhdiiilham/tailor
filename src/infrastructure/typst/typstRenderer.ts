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
// The source can be hand-written, so a compile that loops forever is cut off.
const COMPILE_TIMEOUT_MS = 30_000;

// A compile that failed on the source itself; the message is Typst's own, safe to show.
export class TypstCompileError extends Error {}

// Compiles in a throwaway temp folder and returns the bytes; nothing stays on disk.
export class TypstResumeRenderer implements ResumeRenderer {
  constructor(private readonly typstBin = "typst") {}

  async render({ profile, resume }: Parameters<ResumeRenderer["render"]>[0]): Promise<RenderedResume> {
    const typSource = renderResumeTypst(profile, resume);
    return { typSource, pdf: await this.compile(typSource) };
  }

  async compile(typSource: string): Promise<Buffer> {
    return this.inTempDir(typSource, async (dir) => {
      await this.typst(dir, "resume.pdf");
      return readFile(path.join(dir, "resume.pdf"));
    });
  }

  // One PNG per page, in order, for the on-screen preview.
  async previewPages(typSource: string): Promise<Buffer[]> {
    return this.inTempDir(typSource, async (dir) => {
      await this.typst(dir, "page-{0p}.png", ["--format", "png", "--ppi", String(PREVIEW_PPI)]);
      const pages = (await readdir(dir)).filter((f) => f.startsWith("page-") && f.endsWith(".png")).sort();
      return Promise.all(pages.map((f) => readFile(path.join(dir, f))));
    });
  }

  // Runs from inside the temp folder, which is also the root: files outside it can't be read,
  // and errors name "resume.typ" rather than the temp path.
  private async typst(dir: string, output: string, flags: string[] = []): Promise<void> {
    try {
      await run(this.typstBin, ["compile", "--root", ".", ...flags, "resume.typ", output], {
        cwd: dir,
        timeout: COMPILE_TIMEOUT_MS,
      });
    } catch (err) {
      const { stderr, killed } = err as { stderr?: string; killed?: boolean };
      if (killed) throw new TypstCompileError("Typst took too long to compile this. Check for an endless loop.");
      if (stderr) throw new TypstCompileError(stderr.replaceAll(dir, ".").trim());
      throw err;
    }
  }

  private async inTempDir<T>(typSource: string, work: (dir: string) => Promise<T>): Promise<T> {
    const dir = await mkdtemp(path.join(tmpdir(), "tailor-"));
    try {
      await writeFile(path.join(dir, "resume.typ"), typSource, "utf8");
      return await work(dir);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }
}
