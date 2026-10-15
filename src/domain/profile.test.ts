import { describe, expect, it } from "vitest";
import { parse, stringify } from "yaml";
import { highlightsText, ProfileSchema, toEditableProfile, type Profile } from "./profile";

const profileWith = (highlights: unknown[]) =>
  ProfileSchema.parse({
    personal: { name: "Ada" },
    experience: [{ title: "Dev", company: "Co", start: "2020-01", end: "present", highlights }],
  });

describe("highlights", () => {
  it("keeps a plain string highlight as its text", () => {
    const [highlight] = profileWith(["Cut latency 90%"]).experience[0].highlights;
    expect(highlight).toEqual({ text: "Cut latency 90%", themes: [] });
  });

  it("keeps the short version, impact tier and themes of a detailed highlight", () => {
    const [highlight] = profileWith([
      { text: "Cut latency from 2s to 200ms.", short: "Cut latency 90%", impact: "high", themes: ["performance"] },
    ]).experience[0].highlights;
    expect(highlight).toEqual({
      text: "Cut latency from 2s to 200ms.",
      short: "Cut latency 90%",
      impact: "high",
      themes: ["performance"],
    });
  });

  it("rejects an impact tier that is not high, mid or low", () => {
    expect(() => profileWith([{ text: "x", impact: "huge" }])).toThrow();
  });

  it("applies to project highlights too", () => {
    const profile = ProfileSchema.parse({
      personal: { name: "Ada" },
      projects: [{ name: "Side", highlights: [{ text: "Built it", impact: "mid" }] }],
    });
    expect(profile.projects[0].highlights[0].impact).toBe("mid");
  });
});

describe("highlightsText", () => {
  it("joins the full and short versions, so either one grounds a bullet", () => {
    const { highlights } = profileWith([{ text: "Full text.", short: "Short text." }, "Plain"]).experience[0];
    expect(highlightsText(highlights)).toBe("Full text.\nShort text.\nPlain");
  });
});

describe("profile round trip", () => {
  const roundTrip = (profile: Profile) => ProfileSchema.parse(parse(stringify(profile)));

  it("survives being saved and read again", () => {
    const profile = profileWith(["Plain", { text: "Full", short: "Short", impact: "low", themes: ["a"] }]);
    expect(roundTrip(profile)).toEqual(profile);
  });
});

describe("toEditableProfile", () => {
  it("writes a highlight with no extras back as a plain string", () => {
    const profile = profileWith(["Plain"]);
    expect(toEditableProfile(profile).experience[0].highlights).toEqual(["Plain"]);
  });

  it("keeps only the extras a highlight actually has", () => {
    const profile = profileWith([{ text: "Full", impact: "high" }]);
    expect(toEditableProfile(profile).experience[0].highlights).toEqual([{ text: "Full", impact: "high" }]);
  });

  it("does the same for project highlights", () => {
    const profile = ProfileSchema.parse({ personal: { name: "Ada" }, projects: [{ name: "Side", highlights: ["Built it"] }] });
    expect(toEditableProfile(profile).projects[0].highlights).toEqual(["Built it"]);
  });

  it("parses back to the same profile", () => {
    const profile = profileWith(["Plain", { text: "Full", short: "Short", impact: "low", themes: ["a"] }]);
    expect(ProfileSchema.parse(parse(stringify(toEditableProfile(profile))))).toEqual(profile);
  });
});
