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

// Words the humanizer flags as typical of AI text (its "AI vocabulary" pattern).
export const AI_VOCABULARY = [
  "delve",
  "crucial",
  "pivotal",
  "tapestry",
  "testament",
  "showcase",
  "underscore",
  "intricate",
  "vibrant",
  "landscape",
  "garner",
  "interplay",
  "enduring",
];

// Cover letter phrases that read as generic or AI-written.
export const BANNED_PHRASES = [
  "i am writing to express",
  "i am excited",
  "i'm excited",
  "i am thrilled",
  "passionate about",
  "would be a great fit",
  "throughout my career",
  "i am confident that",
  "thank you for your time and consideration",
  "i look forward to hearing from you",
  "furthermore",
  "moreover",
  "additionally",
  "i hope this",
];

// Everything in a text that should be rewritten: banned words, AI vocabulary and phrases.
export function findWritingTells(text: string): string[] {
  const lower = text.toLowerCase().replace(/[‘’]/g, "'");
  const words = [...BANNED_WORDS, ...AI_VOCABULARY].filter((w) =>
    new RegExp(`\\b${w.replace("-", "\\-")}\\w*`).test(lower),
  );
  const phrases = BANNED_PHRASES.filter((p) => lower.includes(p));
  return [...words, ...phrases];
}

// Plain text for pasting anywhere: no em dashes, straight quotes, no markdown bold.
export function toPlainText(text: string): string {
  return stripEmDashes(text)
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .trim();
}
