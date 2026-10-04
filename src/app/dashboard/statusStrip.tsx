"use client";

import { Key } from "@phosphor-icons/react";
import Link from "next/link";
import { useGeminiKey } from "@/components/geminiKey";

// Facts only: whether this browser has a key, and numbers from your own applications.
type Props = { total: number; averageFit: number | null; applied: number; interviewing: number; offers: number };

export function StatusStrip({ total, averageFit, applied, interviewing, offers }: Props) {
  const key = useGeminiKey();
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-card border border-line bg-raised px-5 py-3 font-mono text-xs text-muted">
      <Link href="/settings" className="inline-flex items-center gap-2 hover:text-ink">
        <Key size={14} className={key ? "text-good" : "text-warn"} />
        {key === null
          ? "Checking key..."
          : key
            ? `Gemini key in this browser (…${key.slice(-4)})`
            : "No Gemini key in this browser"}
      </Link>
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
      <span className="sm:ml-auto">Stored PDFs are deleted after 24 hours</span>
    </div>
  );
}
