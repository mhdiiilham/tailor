import type { Match, MissingKeyword } from "@/domain/fit";
import { Badge, type BadgeTone } from "@/components/ui";

const SUPPORT: Record<Match, { label: string; tone: BadgeTone }> = {
  HAVE: { label: "In your profile", tone: "good" },
  PARTIAL: { label: "Partly in your profile", tone: "warn" },
  MISSING: { label: "Not in your profile", tone: "danger" },
};

// Only keywords the profile backs get used in the resume; the rest are real gaps to know about.
export function MissingKeywords({ items }: { items: MissingKeyword[] }) {
  return (
    <ul className="divide-y divide-line">
      {items.map((k) => (
        <li key={k.keyword} className="grid gap-1.5 py-3 first:pt-0 last:pb-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{k.keyword}</span>
            <Badge tone={SUPPORT[k.support].tone}>{SUPPORT[k.support].label}</Badge>
          </div>
          {k.whereToUse ? <p className="text-sm leading-relaxed text-muted">{k.whereToUse}</p> : null}
        </li>
      ))}
    </ul>
  );
}
