import { describe, expect, it } from "vitest";
import { resumeFileName, slugify } from "./slug";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Senior Backend Engineer (Go)")).toBe("senior-backend-engineer-go");
  });
});

describe("resumeFileName", () => {
  it("matches the /tailored skill's naming", () => {
    expect(resumeFileName("Acme Inc.", "Ada Lovelace", "pdf")).toBe("acme-inc_adalovelace_cv.pdf");
  });
});
