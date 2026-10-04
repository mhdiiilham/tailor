import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ProfileSchema } from "@/domain/profile";
import { TypstResumeRenderer, slugify } from "./typstRenderer";

const hasTypst = (() => {
  try {
    execFileSync("typst", ["--version"]);
    return true;
  } catch {
    return false;
  }
})();

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Senior Backend Engineer (Go)")).toBe("senior-backend-engineer-go");
  });
});

describe.skipIf(!hasTypst)("TypstResumeRenderer", () => {
  it("compiles a resume to PDF", async () => {
    const root = mkdtempSync(path.join(tmpdir(), "resume-"));
    const profile = ProfileSchema.parse({
      personal: { name: "Ada Lovelace", email: "ada@example.com" },
      experience: [{ title: "Engineer", company: "Co", start: "2021-08", end: "present" }],
    });
    const out = await new TypstResumeRenderer(root).render({
      profile,
      company: "Acme Inc.",
      role: "Backend Engineer",
      resume: {
        summary: "Writes Go at https://acme.dev, email me @ ada@example.com.",
        work: [{ experienceIndex: 0, bullets: ["Cut p99 by 50% [~2s] #wins $0 *cost*"] }],
        projects: [],
        skills: [{ category: "Languages", items: ["Go"] }],
        decisions: [],
      },
    });
    expect(out.pdfPath).toBe(path.join(root, "acme-inc_backend-engineer", "acme-inc_adalovelace_cv.pdf"));
    expect(existsSync(out.pdfPath)).toBe(true);
    expect(readFileSync(out.pdfPath).subarray(0, 4).toString()).toBe("%PDF");
  });
});
