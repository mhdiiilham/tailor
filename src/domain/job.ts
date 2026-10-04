import { z } from "zod";

export const JobPostingSchema = z.object({
  company: z.string().describe("Company name, or empty string if not stated"),
  role: z.string().describe("Role title as written in the posting"),
  location: z.string().describe("Location and remote policy, or empty string"),
  responsibilities: z.array(z.string()),
  requirements: z.array(z.string()).describe("Must-have qualifications, one per item"),
  niceToHaves: z.array(z.string()),
  techStack: z.array(z.string()).describe("Tools, languages and platforms named explicitly"),
  yearsRequired: z
    .number()
    .nullable()
    .describe("Minimum years of experience asked for, or null"),
  cultureSignals: z.array(z.string()),
});

export type JobPosting = z.infer<typeof JobPostingSchema>;
