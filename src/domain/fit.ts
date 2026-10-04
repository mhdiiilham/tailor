import { z } from "zod";

export const MatchSchema = z.enum(["HAVE", "PARTIAL", "MISSING"]);
export type Match = z.infer<typeof MatchSchema>;

const MatchedItemSchema = z.object({
  item: z.string(),
  match: MatchSchema,
  evidence: z.string().describe("Where in the profile this comes from, or why it is missing"),
});

// What the LLM judges. The score itself is computed in code (see fitScore).
export const FitJudgementSchema = z.object({
  requirements: z.array(MatchedItemSchema),
  techStack: z.array(MatchedItemSchema),
  niceToHaves: z.array(MatchedItemSchema),
  experienceLevel: z.number().min(0).max(100).describe("Seniority, years and domain match, 0-100"),
  domainFit: z.number().min(0).max(100).describe("Industry relevance, 0-100"),
  angles: z.array(z.string()).describe("The 2-3 profile achievements that best match this role"),
  blockers: z.array(z.string()).describe("Hard requirements the candidate clearly lacks"),
});

export type FitJudgement = z.infer<typeof FitJudgementSchema>;

export type FitAnalysis = FitJudgement & { score: number };

export const LOW_FIT_THRESHOLD = 55;

const WEIGHTS = {
  requirements: 0.4,
  techStack: 0.25,
  experienceLevel: 0.2,
  niceToHaves: 0.1,
  domainFit: 0.05,
};

const CREDIT: Record<Match, number> = { HAVE: 1, PARTIAL: 0.5, MISSING: 0 };

// Percentage of items matched. An empty list means the posting asked for nothing,
// which counts as fully met.
export function coverage(items: { match: Match }[]): number {
  if (items.length === 0) return 100;
  const credit = items.reduce((sum, i) => sum + CREDIT[i.match], 0);
  return (credit / items.length) * 100;
}

export function fitScore(j: FitJudgement): number {
  const total =
    coverage(j.requirements) * WEIGHTS.requirements +
    coverage(j.techStack) * WEIGHTS.techStack +
    j.experienceLevel * WEIGHTS.experienceLevel +
    coverage(j.niceToHaves) * WEIGHTS.niceToHaves +
    j.domainFit * WEIGHTS.domainFit;
  return Math.round(total);
}
