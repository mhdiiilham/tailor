"use client";

import { Key } from "@phosphor-icons/react";
import Link from "next/link";
import { useGeminiKey } from "@/components/geminiKey";
import { formatCount, useGeminiUsage } from "@/components/geminiUsage";
import { dayTotal, usageDay } from "@/domain/usage";

// Facts only: whether this browser has a key, and numbers from your own applications.
type Props = { total: number; averageFit: number | null; applied: number; interviewing: number; offers: number };

export function StatusStrip({ total, averageFit, applied, interviewing, offers }: Props) {
  const key = useGeminiKey();
  const usage = useGeminiUsage();
  const today = usage ? dayTotal(usage, usageDay(new Date())) : null;
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-card border border-line bg-raised px-5 py-3 font-mono text-xs text-muted">
      <Link href="/settings" className="inline-flex items-center gap-2 hover:text-ink">
        <Key size={14} className={key ? "text-good" : "text-warn"} />
        {key === null ? "Checking key..." : key ? `Gemini key (…${key.slice(-4)})` : "No Gemini key in this browser"}
      </Link>
      {key && today ? (
        <Link
          href="/settings#usage"
          className="hover:text-ink"
          title="Gemini calls Tailor made from this browser today"
        >
          Today: <span className="text-ink">{today.requests}</span> calls ·{" "}
          <span className="text-ink">{formatCount(today.inputTokens + today.outputTokens)}</span> tokens
        </Link>
      ) : null}
      <span>
        Applications: <span className="text-ink">{total}</span>
      </span>
      <span>
        Applied: <span className="text-ink">{applied}</span>
      </span>
      <span>
        Interviewing: <span className="text-ink">{interviewing}</span>
      </span>
      <span>
        Offers: <span className={offers ? "text-good" : "text-ink"}>{offers}</span>
      </span>
      {averageFit !== null ? (
        <span>
          Average fit: <span className="text-ink">{averageFit}</span>
        </span>
      ) : null}
      <span className="sm:ml-auto" title="Stored PDFs are deleted 24 hours after they are made">
        PDFs kept 24 hours
      </span>
    </div>
  );
}
