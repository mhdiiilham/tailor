import { z } from "zod";

// Gemini usage as Tailor itself counted it: one entry per model per day. Google has
// no API that reports a key's quota, so this only covers calls made from Tailor in
// this browser; Google AI Studio has the exact numbers.

const UsageEntrySchema = z.object({
  requests: z.number().int().nonnegative(),
  inputTokens: z.number().nonnegative(),
  outputTokens: z.number().nonnegative(),
});
export type UsageEntry = z.infer<typeof UsageEntrySchema>;

// Day ("YYYY-MM-DD", Pacific time) -> model -> totals.
const UsageLogSchema = z.record(z.string(), z.record(z.string(), UsageEntrySchema));
export type UsageLog = z.infer<typeof UsageLogSchema>;

export type GeminiCall = { model: string; inputTokens: number; outputTokens: number };

export const USAGE_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;
const empty = (): UsageEntry => ({ requests: 0, inputTokens: 0, outputTokens: 0 });

// Gemini's daily limits reset at midnight Pacific time, so days are counted the same way.
const pacificDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Los_Angeles",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function usageDay(now: Date): string {
  return pacificDate.format(now);
}

function lastDays(now: Date): string[] {
  return Array.from({ length: USAGE_DAYS }, (_, i) => usageDay(new Date(now.getTime() - i * DAY_MS)));
}

export function recordUsage(log: UsageLog, call: GeminiCall, now: Date): UsageLog {
  const day = usageDay(now);
  const models = { ...(log[day] ?? {}) };
  const entry = models[call.model] ?? empty();
  models[call.model] = {
    requests: entry.requests + 1,
    inputTokens: entry.inputTokens + call.inputTokens,
    outputTokens: entry.outputTokens + call.outputTokens,
  };
  // Drops only days older than the window ("YYYY-MM-DD" sorts by date), never newer ones.
  const oldest = lastDays(now)[USAGE_DAYS - 1];
  return Object.fromEntries(Object.entries({ ...log, [day]: models }).filter(([d]) => d >= oldest));
}

export function dayTotal(log: UsageLog, day: string): UsageEntry & { byModel: Record<string, UsageEntry> } {
  const byModel = log[day] ?? {};
  const total = Object.values(byModel).reduce(
    (sum, e) => ({
      requests: sum.requests + e.requests,
      inputTokens: sum.inputTokens + e.inputTokens,
      outputTokens: sum.outputTokens + e.outputTokens,
    }),
    empty(),
  );
  return { ...total, byModel };
}

// The last 7 days, newest first, including days with no calls.
export function recentDays(log: UsageLog, now: Date): (UsageEntry & { day: string })[] {
  return lastDays(now).map((day) => {
    const { requests, inputTokens, outputTokens } = dayTotal(log, day);
    return { day, requests, inputTokens, outputTokens };
  });
}

// A saved log from browser storage; anything unreadable starts fresh.
export function parseUsageLog(raw: string | null): UsageLog {
  if (!raw) return {};
  try {
    const parsed = UsageLogSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : {};
  } catch {
    return {};
  }
}
