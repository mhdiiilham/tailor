"use client";

import { ArrowSquareOut, ChartBar } from "@phosphor-icons/react";
import { formatCount, useGeminiUsage } from "@/components/geminiUsage";
import { Card, SectionHeader, Skeleton } from "@/components/ui";
import { dayTotal, recentDays, usageDay } from "@/domain/usage";

const dayLabel = new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
// "2026-10-05" -> "Mon, Oct 5" (the day is already in Pacific time; format it as-is).
const formatDay = (day: string) => dayLabel.format(new Date(`${day}T00:00:00Z`));

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 rounded-ui border border-line bg-sunken p-4">
      <span className="font-mono text-[11px] uppercase tracking-wider text-faint">{label}</span>
      <span className="font-mono text-2xl font-semibold tabular-nums">{value}</span>
    </div>
  );
}

// Tailor's own count of its Gemini calls in this browser. Google has no API for a
// key's quota, so the exact numbers and limits are linked from here.
export function GeminiUsageCard() {
  const usage = useGeminiUsage();
  const now = new Date();

  return (
    <Card id="usage" className="scroll-mt-24">
      <SectionHeader
        icon={<ChartBar size={18} />}
        title="Gemini usage"
        description="Counted from Tailor's calls in this browser. A day resets at midnight Pacific time, like Google's daily limits."
      />
      {usage === null ? (
        <Skeleton className="h-40" />
      ) : (
        <UsageDetails today={dayTotal(usage, usageDay(now))} days={recentDays(usage, now)} />
      )}
      <p className="border-t border-line pt-4 text-sm leading-relaxed text-faint">
        Calls from other apps or devices using the same key aren&apos;t included, and retries after a rate limit
        aren&apos;t counted. For exact usage and your limits, see{" "}
        <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-accent underline">
          Google AI Studio
        </a>{" "}
        and{" "}
        <a
          href="https://ai.google.dev/gemini-api/docs/rate-limits"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-accent underline"
        >
          Gemini&apos;s rate limits
          <ArrowSquareOut size={12} />
        </a>
        .
      </p>
    </Card>
  );
}

function UsageDetails({ today, days }: { today: ReturnType<typeof dayTotal>; days: ReturnType<typeof recentDays> }) {
  const peak = Math.max(1, ...days.map((d) => d.inputTokens + d.outputTokens));
  const models = Object.entries(today.byModel);

  return (
    <div className="grid gap-6 border-t border-line pt-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Requests today" value={String(today.requests)} />
        <Stat label="Input tokens" value={formatCount(today.inputTokens)} />
        <Stat label="Output tokens" value={formatCount(today.outputTokens)} />
      </div>

      {models.length > 0 ? (
        <ul className="grid gap-1.5 text-sm">
          {models.map(([model, e]) => (
            <li key={model} className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-xs text-muted">{model}</span>
              <span className="font-mono text-xs text-faint">
                {e.requests} requests · {formatCount(e.inputTokens + e.outputTokens)} tokens
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-faint">No Gemini calls from this browser today.</p>
      )}

      <div className="grid gap-2">
        <p className="font-mono text-[11px] uppercase tracking-wider text-faint">Last 7 days</p>
        <ul className="grid gap-1.5">
          {days.map((d) => {
            const tokens = d.inputTokens + d.outputTokens;
            return (
              <li key={d.day} className="grid grid-cols-[88px_1fr_auto] items-center gap-3 text-xs">
                <span className="text-muted">{formatDay(d.day)}</span>
                <span className="h-2 overflow-hidden rounded-full bg-sunken">
                  <span
                    className="block h-full rounded-full bg-accent"
                    style={{ width: `${(tokens / peak) * 100}%` }}
                  />
                </span>
                <span className="font-mono tabular-nums text-faint">
                  {d.requests} req · {formatCount(tokens)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
