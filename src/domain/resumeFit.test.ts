import { describe, expect, it } from "vitest";
import {
  findLongBullets,
  MAX_BULLET_CHARS,
  MAX_SKILL_ITEMS,
  MAX_SKILL_ROWS,
  pageCountNotice,
  skillsProblem,
} from "./resumeFit";

describe("findLongBullets", () => {
  it("passes bullets that fit on two lines", () => {
    expect(findLongBullets(["Cut latency by 90%.", "x".repeat(MAX_BULLET_CHARS)])).toEqual([]);
  });

  it("returns the start of each bullet that runs past two lines", () => {
    const long = `Handled a production incident ${"x".repeat(MAX_BULLET_CHARS)}`;
    expect(findLongBullets([long, "Short"])).toEqual([`${long.slice(0, 60)}... (${long.length} characters)`]);
  });
});

describe("skillsProblem", () => {
  const rows = (count: number, itemsPerRow = 1) =>
    Array.from({ length: count }, (_, i) => ({
      category: `c${i}`,
      items: Array.from({ length: itemsPerRow }, (_, j) => `s${i}-${j}`),
    }));

  it("accepts a short skills block", () => {
    expect(skillsProblem(rows(MAX_SKILL_ROWS, 2))).toBeNull();
  });

  it("flags too many categories", () => {
    expect(skillsProblem(rows(MAX_SKILL_ROWS + 1))).toMatch(new RegExp(`${MAX_SKILL_ROWS + 1} categories`));
  });

  it("flags too many items in total", () => {
    const total = (MAX_SKILL_ROWS - 1) * (MAX_SKILL_ITEMS / MAX_SKILL_ROWS + 2);
    expect(skillsProblem(rows(MAX_SKILL_ROWS - 1, MAX_SKILL_ITEMS / MAX_SKILL_ROWS + 2))).toMatch(
      new RegExp(`${total} skills`),
    );
  });
});

describe("pageCountNotice", () => {
  it("says nothing about a one-page resume", () => {
    expect(pageCountNotice(1)).toBeNull();
  });

  it("tells the candidate how to get a longer resume back to one page", () => {
    expect(pageCountNotice(2)).toMatch(/2 pages.*one page.*Revise/);
  });
});
