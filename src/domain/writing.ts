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

// Resume summary and bullet cliches that say nothing.
export const RESUME_BANNED_PHRASES = [
  "results-driven",
  // Any "proven ..." claim: track record, background, ability.
  "proven",
  "detail-oriented",
  "team player",
  "self-starter",
  "strong communicator",
  "seasoned professional",
  "hard-working",
];

// Word stems that make a resume read as AI-written ("enhanc" catches enhance, enhancing, enhanced).
export const RESUME_AI_STEMS = [
  "engineered",
  "architected",
  "constructed",
  "resilient",
  "safeguard",
  "gracefully",
  "enhanc",
  "streamlin",
  "empower",
  "elevat",
  "bolster",
  "harness",
  "seamless",
  "slashing",
  "instantaneous",
];

// A clause tacked on after a comma that restates value instead of a fact
// (", enhancing modularity", ", ensuring reliability").
const FILLER_TAIL = /,\s+(enhancing|ensuring|driving|boosting|empowering|fostering|showcasing|highlighting|underscoring)\b/g;

// Banned words, AI vocabulary, AI-sounding stems, filler tails and resume cliches: all worth rewriting.
export function findResumeTells(text: string): string[] {
  const lower = text.toLowerCase();
  const stems = [...AI_VOCABULARY, ...RESUME_AI_STEMS].flatMap((s) => lower.match(new RegExp(`\\b${s}\\w*`, "g")) ?? []);
  const tails = [...lower.matchAll(FILLER_TAIL)].map((m) => `", ${m[1]} ..." tacked on`);
  return [
    ...new Set([
      ...findBannedWords(text),
      ...stems,
      ...tails,
      ...RESUME_BANNED_PHRASES.filter((p) => lower.includes(p)),
    ]),
  ];
}

// Openers that describe a duty, not an outcome.
export const WEAK_OPENERS = ["Responsible for", "Helped with", "Worked on", "Supported", "Handled", "Assisted"];

export function findWeakOpeners(bullets: string[]): string[] {
  const found = bullets
    .map((b) => WEAK_OPENERS.find((w) => b.trim().toLowerCase().startsWith(w.toLowerCase())))
    .filter((w): w is string => w !== undefined);
  return [...new Set(found)];
}
