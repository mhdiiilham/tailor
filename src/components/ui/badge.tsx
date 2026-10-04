import type { ReactNode } from "react";

export type BadgeTone = "neutral" | "accent" | "good" | "warn" | "danger";

const tones: Record<BadgeTone, string> = {
  neutral: "border-line bg-sunken text-muted",
  accent: "border-accent/30 bg-accent-soft text-accent",
  good: "border-good/30 bg-good-soft text-good",
  warn: "border-warn/30 bg-warn-soft text-warn",
  danger: "border-danger/30 bg-danger-soft text-danger",
};

// Small status or metadata label. `mono` for technical values like "MariaDB ~ MySQL".
// `truncate` is for free text that can be long (a full street address, say): it
// shortens with "…" to fit its container and shows the full text on hover.
export function Badge({
  tone = "neutral",
  mono = false,
  truncate = false,
  children,
}: {
  tone?: BadgeTone;
  mono?: boolean;
  truncate?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      title={truncate && typeof children === "string" ? children : undefined}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-chip border px-2 py-0.5 text-xs font-medium ${
        mono ? "font-mono" : ""
      } ${truncate ? "min-w-0 max-w-full" : ""} ${tones[tone]}`}
    >
      {truncate ? <span className="truncate">{children}</span> : children}
    </span>
  );
}
