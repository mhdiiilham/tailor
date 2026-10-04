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
export function Badge({
  tone = "neutral",
  mono = false,
  children,
}: {
  tone?: BadgeTone;
  mono?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-chip border px-2 py-0.5 text-xs font-medium ${
        mono ? "font-mono" : ""
      } ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
