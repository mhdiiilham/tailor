import { stringify } from "yaml";
import type { Profile } from "@/domain/profile";

// Notes carry the candidate's own guardrails ("Not done: Kafka"), so a model
// that mines them for keywords would claim exactly what the candidate ruled out.
export const NOTES_RULE =
  "The profile's notes (top-level and on each role) are background facts and rules from the candidate, not content. Follow them and use them for context, but never turn a note into a bullet, skill, keyword or claim. A tool or skill a note says the candidate has not done counts as missing.";

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
    notes: p.notes,
  });
}
