// "Never fake it", checked in code: every number in a resume bullet must appear somewhere in
// what the candidate gave us (their profile and their answers).

// 1,000 -> "1000", 99.9 -> "99.9", 100K -> "100000", 5ms -> "5". Leading zeros are ignored,
// so a date like 2022-01 contributes 2022 and 1. The K or M suffix only counts when no letter
// follows it, so a unit like ms is not read as millions.
const NUMBER = /(\d[\d,]*(?:\.\d+)?)([kKM](?![a-zA-Z]))?/g;

export function numbersIn(text: string): Set<string> {
  const found = new Set<string>();
  for (const [, raw, suffix] of text.matchAll(NUMBER)) {
    const value = Number(raw.replace(/,/g, ""));
    if (Number.isNaN(value)) continue;
    found.add(String(suffix?.toLowerCase() === "k" ? value * 1_000 : suffix === "M" ? value * 1_000_000 : value));
  }
  return found;
}

export function findUngroundedNumbers(bullets: string[], source: string): string[] {
  const known = numbersIn(source);
  const missing: string[] = [];
  for (const bullet of bullets) {
    for (const n of numbersIn(bullet)) {
      if (!known.has(n) && !missing.includes(n)) missing.push(n);
    }
  }
  return missing;
}

// Claims the model tends to add on its own. Each one must be in the source to stay in a bullet.
export const UNSUPPORTED_CLAIM_PHRASES = [
  "without downtime",
  "zero downtime",
  "zero-downtime",
  "high availability",
  "fault tolerance",
  "deployment velocity",
  "developer productivity",
];

// Work status a resume must never claim unless the candidate said it. A wrong one ends the process.
export const WORK_STATUS_PHRASES = [
  "right to work",
  "work permit",
  "authorized to work",
  "authorised to work",
  "no sponsorship",
  "without sponsorship",
  "citizen",
  "permanent resident",
];

export function findUngroundedClaims(text: string, source: string, phrases = UNSUPPORTED_CLAIM_PHRASES): string[] {
  const lower = text.toLowerCase();
  const known = source.toLowerCase();
  return phrases.filter((p) => lower.includes(p) && !known.includes(p));
}
