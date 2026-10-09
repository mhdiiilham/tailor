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
