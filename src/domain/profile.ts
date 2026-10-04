import { z } from "zod";

const yearMonth = z
  .string()
  .regex(/^\d{4}-\d{2}$/, "expected YYYY-MM");

export const ExperienceSchema = z.object({
  title: z.string().min(1),
  company: z.string().min(1),
  location: z.string().default(""),
  start: yearMonth,
  end: z.union([yearMonth, z.literal("present")]),
  highlights: z.array(z.string()).default([]),
});

export const ProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().default(""),
  url: z.string().default(""),
  tech: z.array(z.string()).default([]),
  highlights: z.array(z.string()).default([]),
  start: yearMonth.optional(),
  end: z.union([yearMonth, z.literal("present")]).optional(),
});

export const EducationSchema = z.object({
  degree: z.string().min(1),
  institution: z.string().min(1),
  year: z.coerce.string(),
  location: z.string().default(""),
});

export const ProfileSchema = z.object({
  personal: z.object({
    name: z.string().min(1),
    email: z.string().default(""),
    phone: z.string().default(""),
    location: z.string().default(""),
    linkedin: z.string().default(""),
    github: z.string().default(""),
    portfolio: z.string().default(""),
  }),
  // Optional italic line under the header, e.g. timezone and work arrangement.
  availability: z.string().default(""),
  summary: z.string().default(""),
  experience: z.array(ExperienceSchema).default([]),
  education: z.array(EducationSchema).default([]),
  skills: z.record(z.string(), z.array(z.string())).default({}),
  spoken_languages: z.array(z.string()).default([]),
  projects: z.array(ProjectSchema).default([]),
  certifications: z.array(z.string()).default([]),
  writing_style: z
    .object({
      voice_sample: z.string().default(""),
      avoid_mentioning: z.array(z.string()).default([]),
      always_include_if_relevant: z.array(z.string()).default([]),
    })
    .default({ voice_sample: "", avoid_mentioning: [], always_include_if_relevant: [] }),
});

export type Profile = z.infer<typeof ProfileSchema>;
export type Experience = z.infer<typeof ExperienceSchema>;
export type Project = z.infer<typeof ProjectSchema>;
