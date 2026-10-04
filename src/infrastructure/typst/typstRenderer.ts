import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import type { RenderedResume, ResumeRenderer } from "@/domain/ports";
import { renderResumeTypst } from "./typstResume";

const run = promisify(execFile);

// Compiles in a throwaway temp folder and returns the bytes; nothing stays on disk.
export class TypstResumeRenderer implements ResumeRenderer {
  constructor(private readonly typstBin = "typst") {}

  async render({ profile, resume }: Parameters<ResumeRenderer["render"]>[0]): Promise<RenderedResume> {
    const typSource = renderResumeTypst(profile, resume);
    const dir = await mkdtemp(path.join(tmpdir(), "tailor-"));
    const typPath = path.join(dir, "resume.typ");
    const pdfPath = path.join(dir, "resume.pdf");
    try {
      await writeFile(typPath, typSource, "utf8");
      await run(this.typstBin, ["compile", typPath, pdfPath]);
      return { typSource, pdf: await readFile(pdfPath) };
    } catch (err) {
      const stderr = (err as { stderr?: string }).stderr ?? String(err);
      throw new Error(`typst compile failed:\n${stderr}`);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }
}
