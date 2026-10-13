import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseProfileYaml } from "./profileYaml";

describe("parseProfileYaml", () => {
  it("parses a full profile.yaml", () => {
    const text = readFileSync(path.resolve(__dirname, "fixtures/profile.example.yaml"), "utf8");
    const profile = parseProfileYaml(text);
    expect(profile.personal.name).not.toBe("");
    expect(profile.experience.length).toBeGreaterThan(0);
  });

  it("keeps the notes on an experience entry", () => {
    const yaml = `personal: {name: X}
experience:
  - {title: Dev, company: Co, start: "2020-01", end: present, notes: ["Title as written on the contract."]}`;
    expect(parseProfileYaml(yaml).experience[0].notes).toEqual(["Title as written on the contract."]);
  });

  it("rejects a malformed date", () => {
    const yaml = `personal: {name: X}\nexperience:\n  - {title: Dev, company: Co, start: "2020", end: present}`;
    expect(() => parseProfileYaml(yaml)).toThrow(/YYYY-MM/);
  });
});
