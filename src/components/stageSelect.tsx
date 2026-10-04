"use client";

import { CaretDown } from "@phosphor-icons/react";
import { useState, useTransition } from "react";
import { setApplicationStage } from "@/app/actions";
import { STAGE_LABELS, STAGES, type Stage } from "@/domain/stage";

// Stage colors: blue while in progress, green for an offer, red for rejected, grey otherwise.
const STAGE_STYLES: Record<Stage, string> = {
  not_applied: "border-line bg-sunken text-muted",
  applied: "border-accent/30 bg-accent-soft text-accent",
  interviewing: "border-accent/40 bg-accent-soft text-accent",
  offer: "border-good/40 bg-good-soft text-good",
  rejected: "border-danger/30 bg-danger-soft text-danger",
  withdrawn: "border-line bg-sunken text-faint",
};

export function StageSelect({ id, stage, label = "Application stage" }: { id: number; stage: Stage; label?: string }) {
  const [value, setValue] = useState<Stage>(stage);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function change(next: Stage) {
    const previous = value;
    setValue(next);
    setError(undefined);
    startTransition(async () => {
      const result = await setApplicationStage(id, next);
      if (result.error) {
        setValue(previous);
        setError(result.error);
      }
    });
  }

  return (
    <span className="inline-grid gap-1">
      <span className="relative inline-flex">
        <select
          aria-label={label}
          value={value}
          disabled={pending}
          onChange={(e) => change(e.target.value as Stage)}
          className={`h-8 cursor-pointer appearance-none rounded-chip border py-0 pl-2.5 pr-7 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft disabled:opacity-60 ${STAGE_STYLES[value]}`}
        >
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {STAGE_LABELS[s]}
            </option>
          ))}
        </select>
        <CaretDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 opacity-70" />
      </span>
      {error ? <span className="text-xs text-danger">{error}</span> : null}
    </span>
  );
}
