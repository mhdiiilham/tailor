export const BANNED_WORDS = [
  "leverage",
  "robust",
  "seamlessly",
  "cutting-edge",
  "spearheaded",
  "fostered",
  "synergy",
  "holistic",
  "innovative",
  "transformative",
  "utilize",
  "facilitate",
  "passionate",
  "excited",
  "thrilled",
  "dynamic",
  "best-in-class",
  "world-class",
  "game-changing",
  "scalable solutions",
  "impactful",
];

export function findBannedWords(text: string): string[] {
  const lower = text.toLowerCase();
  return BANNED_WORDS.filter((w) =>
    new RegExp(`\\b${w.replace("-", "\\-")}\\w*`).test(lower),
  );
}

// Em dashes read as AI-written. A spaced dash becomes a comma, a tight one a hyphen.
export function stripEmDashes(text: string): string {
  return text.replace(/\s+\u2014\s+/g, ", ").replace(/\u2014/g, "-");
}
