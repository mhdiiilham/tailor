import { describe, expect, it } from "vitest";
import { ProfileSchema } from "@/domain/profile";
import { ANALYZE_FIT_SYSTEM } from "./analysis";
import { COVER_LETTER_SYSTEM } from "./coverLetter";
import { NOTES_RULE, profileContext } from "./profileContext";
import { TAILOR_RESUME_SYSTEM } from "./resume";

describe("profileContext", () => {
  it("shows the model the notes about the whole profile", () => {
    const profile = ProfileSchema.parse({ personal: { name: "Ada" }, notes: ["Never claim Kafka."] });
    expect(profileContext(profile)).toContain("Never claim Kafka.");
  });

  it("shows plain highlights as plain lines and keeps the notes on detailed ones", () => {
    const profile = ProfileSchema.parse({
      personal: { name: "Ada" },
      experience: [
        {
          title: "Dev",
          company: "Co",
          start: "2020-01",
          end: "present",
          highlights: ["Plain one", { text: "Full one", short: "Short one", impact: "high", themes: ["reliability"] }],
        },
      ],
    });
    const context = profileContext(profile);
    expect(context).toContain("- Plain one");
    expect(context).toMatch(/short: Short one/);
    expect(context).toMatch(/impact: high/);
    expect(context).not.toContain("themes: []");
  });

  it.each([
    ["fit analysis", ANALYZE_FIT_SYSTEM],
    ["resume", TAILOR_RESUME_SYSTEM],
    ["cover letter", COVER_LETTER_SYSTEM],
  ])("tells the %s prompt that notes are never content", (_, system) => {
    expect(system).toContain(NOTES_RULE);
  });
});

describe("ANALYZE_FIT_SYSTEM", () => {
  it("asks for the posting's location or work-authorization limit", () => {
    expect(ANALYZE_FIT_SYSTEM).toMatch(/hiringRestriction/);
    expect(ANALYZE_FIT_SYSTEM).toMatch(/right to work/i);
  });

  it("asks a gap question about a limit the candidate's availability does not cover", () => {
    expect(ANALYZE_FIT_SYSTEM).toMatch(/AVAILABILITY/);
    expect(ANALYZE_FIT_SYSTEM).toMatch(/one of the questions must ask/i);
  });
});
