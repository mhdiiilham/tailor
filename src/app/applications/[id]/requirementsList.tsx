"use client";

import { Check, CircleHalf, X } from "@phosphor-icons/react";
import { useState } from "react";
import type { Match, MatchedItem } from "@/domain/fit";
import { Badge, type BadgeTone } from "@/components/ui";

const STATUS: Record<Match, { label: string; tone: BadgeTone; icon: typeof Check; iconBox: string }> = {
  HAVE: { label: "Matched", tone: "good", icon: Check, iconBox: "bg-good-soft text-good" },
  PARTIAL: { label: "Partial", tone: "warn", icon: CircleHalf, iconBox: "bg-warn-soft text-warn" },
  MISSING: { label: "Missing", tone: "danger", icon: X, iconBox: "bg-danger-soft text-danger" },
};

const FILTERS: { value: Match | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "HAVE", label: "Matched" },
  { value: "PARTIAL", label: "Partial" },
  { value: "MISSING", label: "Missing" },
];

const INITIAL_VISIBLE = 6;

export function RequirementsList({ items }: { items: MatchedItem[] }) {
  const [filter, setFilter] = useState<Match | "ALL">("ALL");
  const [showAll, setShowAll] = useState(false);

  const filtered = filter === "ALL" ? items : items.filter((i) => i.match === filter);
  const visible = showAll ? filtered : filtered.slice(0, INITIAL_VISIBLE);
  const count = (value: Match | "ALL") =>
    value === "ALL" ? items.length : items.filter((i) => i.match === value).length;

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter requirements">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            role="tab"
            aria-selected={filter === f.value}
            onClick={() => setFilter(f.value)}
            className={`inline-flex items-center gap-1.5 rounded-ui border px-3 py-1.5 text-sm transition-colors ${
              filter === f.value ? "border-accent/40 bg-accent-soft text-ink" : "border-line text-muted hover:text-ink"
            }`}
          >
            {f.label}
            <span className="font-mono text-xs text-faint">{count(f.value)}</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-faint">Nothing in this group.</p>
      ) : (
        <ul className="divide-y divide-line">
          {visible.map((item) => {
            const status = STATUS[item.match];
            const Icon = status.icon;
            return (
              <li
                key={`${item.match}-${item.item}`}
                className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 py-4 first:pt-0"
              >
                <span className={`mt-0.5 grid size-7 place-items-center rounded-ui ${status.iconBox}`}>
                  <Icon size={15} weight="bold" />
                </span>
                <div className="grid min-w-0 gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{item.item}</span>
                    <Badge tone={status.tone}>{status.label}</Badge>
                    {item.tag ? <Badge mono>{item.tag}</Badge> : null}
                  </div>
                  {item.evidence ? <p className="text-sm leading-relaxed text-muted">{item.evidence}</p> : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {filtered.length > INITIAL_VISIBLE ? (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="justify-self-start text-sm font-medium text-accent"
        >
          {showAll ? "Show fewer" : `Show all ${filtered.length}`}
        </button>
      ) : null}
    </div>
  );
}
