import { describe, expect, it } from "vitest";
import { MAX_BULLET_CHARS, MAX_SKILL_ITEMS, MAX_SKILL_ROWS } from "@/domain/resumeFit";
import { AI_VOCABULARY, BANNED_WORDS, RESUME_AI_STEMS } from "@/domain/writing";
import { TAILOR_RESUME_SYSTEM } from "./resume";

describe("TAILOR_RESUME_SYSTEM", () => {
  it("does not dump the whole banned list into the prompt", () => {
    const listed = [...BANNED_WORDS, ...AI_VOCABULARY, ...RESUME_AI_STEMS].filter((w) => TAILOR_RESUME_SYSTEM.includes(w));
    expect(listed.length).toBeLessThanOrEqual(10);
  });

  it("explains how to use a highlight's impact tier, short version and themes", () => {
    expect(TAILOR_RESUME_SYSTEM).toMatch(/impact/);
    expect(TAILOR_RESUME_SYSTEM).toMatch(/short/);
    expect(TAILOR_RESUME_SYSTEM).toMatch(/themes/);
  });

  it("states the bullet and skills limits the code enforces", () => {
    expect(TAILOR_RESUME_SYSTEM).toContain(`${MAX_BULLET_CHARS} characters`);
    expect(TAILOR_RESUME_SYSTEM).toContain(`${MAX_SKILL_ROWS} categories`);
    expect(TAILOR_RESUME_SYSTEM).toContain(`${MAX_SKILL_ITEMS} skills`);
  });

  it("keeps an outage story from opening a role", () => {
    expect(TAILOR_RESUME_SYSTEM).toMatch(/never open a role with a bullet about something breaking/i);
  });
});
