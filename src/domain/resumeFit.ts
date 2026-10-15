// A one-page resume stays readable only if bullets and skills stay short. Code can't see
// the page, so these limits stand in for it; the real page count is checked after rendering.

// About two printed lines at the resume's font size.
export const MAX_BULLET_CHARS = 220;
export const MAX_SKILL_ROWS = 6;
export const MAX_SKILL_ITEMS = 30;

const PREVIEW_CHARS = 60;

export function findLongBullets(bullets: string[]): string[] {
  return bullets
    .filter((b) => b.length > MAX_BULLET_CHARS)
    .map((b) => `${b.slice(0, PREVIEW_CHARS)}... (${b.length} characters)`);
}

export function skillsProblem(skills: { category: string; items: string[] }[]): string | null {
  const itemCount = skills.reduce((sum, row) => sum + row.items.length, 0);
  if (skills.length > MAX_SKILL_ROWS) {
    return `Skills has ${skills.length} categories, keep at most ${MAX_SKILL_ROWS}: merge or drop the ones this job doesn't ask about`;
  }
  if (itemCount > MAX_SKILL_ITEMS) {
    return `Skills lists ${itemCount} skills, keep at most ${MAX_SKILL_ITEMS}: only what this job asks for or clearly relates to`;
  }
  return null;
}

// Shown once the real PDF is rendered. Two pages is fine for a long career, but not by accident.
export function pageCountNotice(pages: number): string | null {
  if (pages <= 1) return null;
  return `This resume runs ${pages} pages. Most recruiters read one page. Use Revise to ask for "one page: cut the weakest bullets and shorten skills", unless the posting asks for more years than one page can show.`;
}
