import type { FitAnalysis } from "./fit";
import type { TailoredResume } from "./resume";

// Which posting keywords made it into the final resume. Checked in code against the resume
// text, so it needs no model call and can't be talked up.

export function resumeSearchText(r: TailoredResume): string {
  return [
    r.summary,
    ...r.work.flatMap((w) => w.bullets),
    ...r.projects.flatMap((p) => p.bullets),
    ...r.skills.flatMap((s) => [s.category, ...s.items]),
  ].join("\n");
}

// The keywords an honest resume can contain: tech the profile backs and keywords it supports.
// True gaps (MISSING) are left out, since the resume must not claim them.
export function coverableKeywords(fit: FitAnalysis): string[] {
  const names = [
    ...fit.techStack.filter((t) => t.match !== "MISSING").map((t) => t.item),
    ...(fit.missingKeywords ?? []).filter((k) => k.support !== "MISSING").map((k) => k.keyword),
  ];
  const seen = new Set<string>();
  return names.filter((n) => {
    const key = n.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");

// Whole terms only (Java is not JavaScript). Names of three letters or fewer match by exact
// case, so "Go" is the language and not the verb.
function mentions(text: string, keyword: string): boolean {
  const term = keyword.trim();
  const pattern = new RegExp(`(?<![A-Za-z0-9])${escape(term)}(?![A-Za-z0-9])`, term.length <= 3 ? "" : "i");
  return pattern.test(text);
}

export function keywordCoverage(keywords: string[], resumeText: string): { covered: string[]; missing: string[] } {
  const covered: string[] = [];
  const missing: string[] = [];
  for (const k of keywords) (mentions(resumeText, k) ? covered : missing).push(k);
  return { covered, missing };
}
