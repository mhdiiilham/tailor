"use client";

import { CheckCircle, CircleNotch } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

export type PendingStep = { label: string; startsAt: number };

// Shown inside a form while its action runs. Steps advance on a timer (the server
// doesn't report progress), and the last one stays active until the form is done.
export function PendingSteps({ title, steps, note }: { title: string; steps: PendingStep[]; note?: string }) {
  const { pending } = useFormStatus();
  if (!pending) return null;
  return <Running title={title} steps={steps} note={note} />;
}

function Running({ title, steps, note }: { title: string; steps: PendingStep[]; note?: string }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const started = Date.now();
    const timer = setInterval(() => setSeconds(Math.floor((Date.now() - started) / 1000)), 500);
    return () => clearInterval(timer);
  }, []);

  const active = steps.reduce((current, step, i) => (seconds >= step.startsAt ? i : current), 0);

  return (
    <div role="status" aria-live="polite" className="grid gap-4 rounded-ui border border-accent/30 bg-accent-soft p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">{title}</p>
        <span className="font-mono text-xs tabular-nums text-faint">{seconds}s</span>
      </div>

      <div className="h-1 overflow-hidden rounded-full bg-line" aria-hidden>
        <div className="h-full w-1/3 rounded-full bg-accent motion-safe:animate-[pending-slide_1.4s_ease-in-out_infinite]" />
      </div>

      <ol className="grid gap-2">
        {steps.map((step, i) => {
          const done = i < active;
          const current = i === active;
          return (
            <li
              key={step.label}
              className={`flex items-center gap-2.5 text-sm ${done ? "text-muted" : current ? "text-ink" : "text-faint"}`}
            >
              {done ? (
                <CheckCircle size={16} weight="fill" className="shrink-0 text-good" />
              ) : current ? (
                <CircleNotch size={16} className="shrink-0 text-accent motion-safe:animate-spin" />
              ) : (
                <span className="grid size-4 shrink-0 place-items-center">
                  <span className="size-1.5 rounded-full bg-line" />
                </span>
              )}
              {step.label}
            </li>
          );
        })}
      </ol>

      {note ? <p className="text-xs text-faint">{note}</p> : null}
    </div>
  );
}
