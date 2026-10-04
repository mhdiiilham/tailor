import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import type { RenderedResume, ResumeRenderer } from "@/domain/ports";
import { renderResumeTypst } from "./typstResume";

const run = promisify(execFile);

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Writes tailored/<company>_<role>/<company>_<name>_cv.{typ,pdf}, the same layout
// the /tailored skill uses, so both share one history.
export class TypstResumeRenderer implements ResumeRenderer {
  constructor(
    private readonly outputRoot: string,
    private readonly typstBin = "typst",
  ) {}

  async render({ profile, resume, company, role }: Parameters<ResumeRenderer["render"]>[0]): Promise<RenderedResume> {
    const companySlug = slugify(company) || "company";
    const dir = path.join(this.outputRoot, `${companySlug}_${slugify(role) || "role"}`);
    const base = `${companySlug}_${slugify(profile.personal.name).replace(/-/g, "")}_cv`;
    const typPath = path.join(dir, `${base}.typ`);
    const pdfPath = path.join(dir, `${base}.pdf`);

    await mkdir(dir, { recursive: true });
    await writeFile(typPath, renderResumeTypst(profile, resume), "utf8");
    try {
      await run(this.typstBin, ["compile", typPath, pdfPath]);
    } catch (err) {
      const stderr = (err as { stderr?: string }).stderr ?? String(err);
      throw new Error(`typst compile failed for ${typPath}:\n${stderr}`);
    }
    return { typPath, pdfPath };
  }
}
