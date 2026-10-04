import { z } from "zod";

export const MatchSchema = z.enum(["HAVE", "PARTIAL", "MISSING"]);
export type Match = z.infer<typeof MatchSchema>;

const MatchedItemSchema = z.object({
  item: z.string(),
  match: MatchSchema,
  evidence: z.string().describe("Where in the profile this comes from, or why it is missing"),
  tag: z
    .string()
    .describe('2-3 word label for how it matches, e.g. "Primary stack", "MariaDB ~ MySQL", "Bootcamp only"'),
});

export const AngleSchema = z.object({
  title: z.string().describe("Short headline for the strength, e.g. \"Payments idempotency and settlement\""),
  detail: z.string().describe("One or two sentences of concrete evidence from the profile"),
  source: z.string().describe("Where it comes from: company or project name(s) in the profile"),
  jdQuote: z.string().describe("The job description requirement it answers, quoted or closely paraphrased"),
});
export type Angle = z.infer<typeof AngleSchema>;

// What the LLM judges. The score itself is computed in code (see fitScore).
export const FitJudgementSchema = z.object({
  requirements: z.array(MatchedItemSchema),
  techStack: z.array(MatchedItemSchema),
  niceToHaves: z.array(MatchedItemSchema),
  experienceLevel: z.number().min(0).max(100).describe("Seniority, years and domain match, 0-100"),
  domainFit: z.number().min(0).max(100).describe("Industry relevance, 0-100"),
  angles: z.array(AngleSchema).describe("The 2-3 profile achievements that best match this role"),
  blockers: z.array(z.string()).describe("Hard requirements the candidate clearly lacks"),
});

export type FitJudgement = z.infer<typeof FitJudgementSchema>;

export type FitAnalysis = FitJudgement & { score: number };
export type MatchedItem = FitJudgement["requirements"][number];

// Analyses saved before angles and tags were structured stored angles as plain
// sentences and items without a tag. Upgrade them so the UI has one shape.
export function normalizeFit(raw: FitAnalysis): FitAnalysis {
  const item = (i: MatchedItem): MatchedItem => ({ ...i, tag: i.tag ?? "" });
  return {
    ...raw,
    requirements: raw.requirements.map(item),
    techStack: raw.techStack.map(item),
    niceToHaves: raw.niceToHaves.map(item),
    angles: raw.angles.map((a: Angle | string) =>
      typeof a === "string" ? { title: "", detail: a, source: "", jdQuote: "" } : a,
    ),
  };
}

export function matchCounts(fit: FitAnalysis): Record<Match, number> {
  const counts: Record<Match, number> = { HAVE: 0, PARTIAL: 0, MISSING: 0 };
  for (const i of [...fit.requirements, ...fit.techStack]) counts[i.match]++;
  return counts;
}

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
