import { z } from "zod";

// Hacker News "Ask HN: Who is hiring?" threads: one thread a month, one job post per
// top-level comment. Posts are public; their text is stored as plain text.

export const WORK_MODES = ["remote", "hybrid", "onsite", "unknown"] as const;
export type WorkMode = (typeof WORK_MODES)[number];

// What Gemini Flash-Lite extracts from one post. Missing facts are empty, never guessed.
export const HnJobSchema = z.object({
  company: z.string().describe("Company name, or empty string"),
  role: z.string().describe("Role title(s), comma-separated if several, or empty string"),
  location: z.string().describe("Location(s) and region limits as written, e.g. 'Remote (US)', or empty string"),
  workMode: z.enum(WORK_MODES).describe("remote, hybrid, onsite, or unknown when the post doesn't say"),
  salary: z.string().describe("Salary or equity as written, or empty string"),
  techStack: z.array(z.string()).max(12).describe("Languages, frameworks and tools named in the post"),
  applyUrl: z.string().describe("The application or careers URL from the post, or empty string"),
});
export type HnJob = z.infer<typeof HnJobSchema>;

// A batch of posts sent in one call; each result names the post it belongs to.
export const HnJobBatchSchema = z.object({
  posts: z.array(HnJobSchema.extend({ id: z.number().int().describe("The post id given in the input") })),
});

export type HnPost = {
  id: number;
  threadId: number;
  author: string;
  postedAt: Date;
  text: string;
  job: HnJob | null; // null until parsed
};

export type HnPostQuery = { workMode: WorkMode | "all"; search: string; cursor?: string; limit: number };
export type HnPostPage = { items: HnPost[]; nextCursor: string | null };

// "Ask HN: Who is hiring? (October 2026)" -> "October 2026"; the title itself otherwise.
export function threadMonth(title: string): string {
  return /\(([^)]+)\)\s*$/.exec(title)?.[1] ?? title;
}

export function isHiringThread(title: string): boolean {
  return /^Ask HN: Who is hiring\?/i.test(title.trim());
}

// Only web links: an extracted URL can never become a javascript: link on the page.
export function safeUrl(url: string): string {
  const value = url.trim();
  return /^https?:\/\/[^\s"'<>]+$/i.test(value) ? value : "";
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] === "#") {
      const n = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : match;
    }
    return ENTITIES[code.toLowerCase()] ?? match;
  });
}

// HN comment HTML to plain text: <p> becomes a blank line, links become their full
// target (HN shortens the visible text), every other tag is dropped.
export function hnText(html: string): string {
  const text = html
    .replace(/<a\s[^>]*href="([^"]*)"[^>]*>[\s\S]*?<\/a>/gi, (_, href: string) => decodeEntities(href))
    .replace(/<p>/gi, "\n\n")
    .replace(/<\/?pre>|<\/?code>/gi, "")
    .replace(/<[^>]+>/g, "");
  return decodeEntities(text)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// A post id from a URL: digits only, so "12abc", "1e3" or " 12" never reach the database.
export function parseHnPostId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

// Where one post can be opened and shared.
export const hnPostPath = (id: number): string => `/jobs/${id}`;

// A post's name for the page title and headings: role and company once parsed, otherwise
// the first line of the post as written.
export function hnPostTitle(text: string, job: HnJob | null): string {
  if (job?.company || job?.role)
    return job.role && job.company ? `${job.role} at ${job.company}` : job.role || job.company;
  return text.split("\n")[0].slice(0, 120);
}
