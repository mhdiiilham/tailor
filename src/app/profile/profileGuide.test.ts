import { describe, expect, it } from "vitest";
import { ProfileSchema } from "@/domain/profile";
import { parseProfileYaml } from "@/infrastructure/profileYaml";
import { PROFILE_GUIDE, PROFILE_TEMPLATE } from "./profileGuide";

describe("profile guide", () => {
  it("builds a template that passes profile validation", () => {
    const profile = parseProfileYaml(PROFILE_TEMPLATE);
    expect(profile.personal.name).toBe("Your Name");
    expect(profile.experience).toHaveLength(2);
    expect(profile.projects[0].tech).toEqual(["Go", "PostgreSQL"]);
  });

  it("documents every top-level profile field", () => {
    expect(PROFILE_GUIDE.map((s) => s.key).sort()).toEqual(Object.keys(ProfileSchema.shape).sort());
  });
});
