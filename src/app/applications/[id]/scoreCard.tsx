import { LOW_FIT_THRESHOLD, type Match } from "@/domain/fit";

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const COUNT_LABELS: { match: Match; label: string; className: string }[] = [
  { match: "HAVE", label: "Matched", className: "text-good" },
  { match: "PARTIAL", label: "Partial", className: "text-warn" },
  { match: "MISSING", label: "Missing", className: "text-danger" },
];

// The fit score as a ring, with how many requirements matched.
export function ScoreCard({ score, counts }: { score: number; counts: Record<Match, number> }) {
  const low = score < LOW_FIT_THRESHOLD;
  return (
    <div className="flex flex-col items-center gap-5 rounded-card border border-line bg-raised p-5 sm:flex-row sm:gap-6">
      <div className="relative size-32 shrink-0">
        <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden>
          <circle cx="60" cy="60" r={RADIUS} fill="none" strokeWidth="9" className="stroke-sunken" />
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - score / 100)}
            className={low ? "stroke-danger" : "stroke-accent"}
          />
        </svg>
        <div className="absolute inset-0 grid place-content-center text-center">
          <span className="font-mono text-4xl font-semibold tabular-nums">{score}</span>
          <span className="font-mono text-[11px] text-faint">/100 fit</span>
        </div>
      </div>
      <dl className="grid w-full flex-1 grid-cols-3 gap-2">
        {COUNT_LABELS.map(({ match, label, className }) => (
          <div key={match} className="grid gap-0.5 rounded-ui border border-line bg-sunken px-2 py-2.5 text-center">
            <dd className={`font-mono text-lg font-semibold tabular-nums ${className}`}>{counts[match]}</dd>
            <dt className="text-xs text-faint">{label}</dt>
          </div>
        ))}
      </dl>
    </div>
  );
}
