import type { Experience } from "./profile";

// Whole years of work as a recruiter counts them from the dates: gaps are left out and
// overlapping roles (a freelance gig next to a job) count once. Both end months count.
export function yearsOfExperience(roles: Pick<Experience, "start" | "end">[], today: Date): number {
  const month = (value: string) => {
    if (value === "present") return today.getFullYear() * 12 + today.getMonth();
    const [year, m] = value.split("-").map(Number);
    return year * 12 + m - 1;
  };
  const ranges = roles.map((r) => [month(r.start), month(r.end) + 1]).sort((a, b) => a[0] - b[0]);
  let months = 0;
  let covered = -Infinity;
  for (const [start, end] of ranges) {
    const from = Math.max(start, covered);
    if (end > from) months += end - from;
    covered = Math.max(covered, end);
  }
  return Math.floor(months / 12);
}

// Years a text claims: "6+ years", "5 years of" -> [6, 5].
export function yearsClaimed(text: string): number[] {
  return [...text.matchAll(/(\d+)\s*\+?\s*years?\b/gi)].map((m) => Number(m[1]));
}
