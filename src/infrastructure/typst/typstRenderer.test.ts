import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { ProfileSchema } from "@/domain/profile";
import { TypstResumeRenderer } from "./typstRenderer";

const hasTypst = (() => {
  try {
    execFileSync("typst", ["--version"]);
    return true;
  } catch {
    return false;
  }
})();

describe.skipIf(!hasTypst)("TypstResumeRenderer", () => {
  it("compiles a resume to PDF bytes", async () => {
    const profile = ProfileSchema.parse({
      personal: { name: "Ada Lovelace", email: "ada@example.com" },
      experience: [{ title: "Engineer", company: "Co", start: "2021-08", end: "present" }],
    });
    const out = await new TypstResumeRenderer().render({
      profile,
      resume: {
        summary: "Writes Go at https://acme.dev, email me @ ada@example.com.",
        work: [{ experienceIndex: 0, bullets: ["Cut p99 by 50% [~2s] #wins $0 *cost*"] }],
        projects: [],
        skills: [{ category: "Languages", items: ["Go"] }],
        decisions: [],
      },
    });
    expect(out.pdf.subarray(0, 4).toString()).toBe("%PDF");
    expect(out.typSource).toContain('#let name = "Ada Lovelace"');
  });
});
