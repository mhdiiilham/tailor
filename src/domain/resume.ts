import { z } from "zod";

// The LLM picks roles and projects by index into the profile, so titles, companies
// and dates always come from the profile and can't be inflated.
export const TailoredResumeSchema = z.object({
  summary: z
    .string()
    .describe("2-3 sentences, or empty string to omit the Summary section"),
  work: z.array(
    z.object({
      experienceIndex: z.number().int().min(0),
      bullets: z.array(z.string()).min(1).max(6),
    }),
  ),
  projects: z
    .array(
      z.object({
        projectIndex: z.number().int().min(0),
        bullets: z.array(z.string()).min(1).max(4),
      }),
    )
    .max(3),
  skills: z.array(
    z.object({
      category: z.string(),
      items: z.array(z.string()).min(1),
    }),
  ),
  // Required so the model always writes it; an optional field tends to come back empty.
  availability: z
    .string()
    .describe("The candidate's AVAILABILITY line rewritten for this job's location and work mode"),
  decisions: z
    .array(z.string())
    .describe("Short notes on what was emphasized, cut, and which JD keywords were surfaced where"),
});

export type TailoredResume = z.infer<typeof TailoredResumeSchema>;
