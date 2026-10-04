import { stringify } from "yaml";
import type { Profile } from "@/domain/profile";

// The profile as the model sees it. Experience and projects carry an explicit
// index, which the tailored resume refers back to.
export function profileContext(p: Profile): string {
  return stringify({
    summary: p.summary,
    experience: p.experience.map((e, index) => ({ index, ...e })),
    projects: p.projects.map((proj, index) => ({ index, ...proj })),
    education: p.education,
    skills: p.skills,
    certifications: p.certifications,
  });
}
