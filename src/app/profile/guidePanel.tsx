"use client";

import { CaretRight, Check, Copy } from "@phosphor-icons/react";
import { useState, type ReactNode } from "react";
import { Badge, type BadgeTone } from "@/components/ui";
import { PROFILE_GUIDE, type GuideSection } from "./profileGuide";

const NEED_TONE: Record<GuideSection["need"], BadgeTone> = {
  Required: "accent",
  Recommended: "good",
  Optional: "neutral",
};

// Renders `backticks` in the guide text as inline code.
function withCode(text: string): ReactNode[] {
  return text.split(/(`[^`]+`)/).map((part, i) =>
    part.startsWith("`") ? (
      <code key={i} className="rounded-chip bg-sunken px-1 py-0.5 font-mono text-[12px] text-ink">
        {part.slice(1, -1)}
      </code>
    ) : (
      part
    ),
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // Clipboard blocked; the example can still be selected by hand.
        }
      }}
      className="inline-flex items-center gap-1 rounded-chip border border-line bg-raised px-2 py-1 text-xs text-muted hover:text-ink"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function GuidePanel() {
  return (
    <aside
      className="grid min-w-0 content-start gap-4 rounded-card border border-line bg-raised p-5"
      aria-label="Profile guide"
    >
      <div className="grid gap-1">
        <h2 className="text-lg font-medium">Profile guide</h2>
        <p className="text-sm text-muted">What each part is for. Open one for details and an example to copy.</p>
      </div>
      <div className="divide-y divide-line border-y border-line">
        {PROFILE_GUIDE.map((s) => (
          <details key={s.key} className="group min-w-0 py-1">
            <summary className="flex cursor-pointer list-none items-center gap-2 py-2.5 [&::-webkit-details-marker]:hidden">
              <CaretRight size={13} className="shrink-0 text-faint transition-transform group-open:rotate-90" />
              <span className="flex-1 text-sm font-medium">{s.title}</span>
              <code className="hidden font-mono text-[11px] text-faint sm:inline">{s.key}</code>
              <Badge tone={NEED_TONE[s.need]}>{s.need}</Badge>
            </summary>
            <div className="grid min-w-0 gap-3 pb-4 pl-5">
              <ul className="grid list-disc gap-1.5 pl-4 text-sm leading-relaxed text-muted">
                {s.points.map((p) => (
                  <li key={p}>{withCode(p)}</li>
                ))}
              </ul>
              <div className="relative min-w-0">
                <pre className="overflow-x-auto rounded-ui border border-line bg-sunken p-3 pr-16 font-mono text-[12px] leading-relaxed text-ink">
                  {s.example}
                </pre>
                <div className="absolute right-2 top-2">
                  <CopyButton text={s.example} />
                </div>
              </div>
            </div>
          </details>
        ))}
      </div>
    </aside>
  );
}
