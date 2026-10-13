import { describe, expect, it } from "vitest";
import { ProfileSchema } from "@/domain/profile";
import { profileContext } from "./profileContext";

describe("profileContext", () => {
  it("shows the model the notes about the whole profile", () => {
    const profile = ProfileSchema.parse({ personal: { name: "Ada" }, notes: ["Never claim Kafka."] });
    expect(profileContext(profile)).toContain("Never claim Kafka.");
  });
});
