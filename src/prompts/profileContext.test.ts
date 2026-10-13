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

  it.each([
    ["fit analysis", ANALYZE_FIT_SYSTEM],
    ["resume", TAILOR_RESUME_SYSTEM],
    ["cover letter", COVER_LETTER_SYSTEM],
  ])("tells the %s prompt that notes are never content", (_, system) => {
    expect(system).toContain(NOTES_RULE);
  });
});
