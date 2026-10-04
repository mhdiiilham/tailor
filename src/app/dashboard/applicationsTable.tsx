"use client";

import { ChartBar, DownloadSimple, MagnifyingGlass, PencilSimple, Trash } from "@phosphor-icons/react";
import { useMemo, useState, useTransition } from "react";
import { deleteApplication } from "@/app/actions";
import { Badge, Button, ButtonAnchor, ButtonLink } from "@/components/ui";
import { LOW_FIT_THRESHOLD } from "@/domain/fit";
import { filterRows, summarize, type ApplicationRow, type StatusFilter } from "./rows";

const dateFormat = new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" });

function Fit({ score }: { score: number }) {
  return (
    <span className="inline-flex items-baseline gap-1 rounded-ui border border-line bg-sunken px-2.5 py-1">
      <span
        className={`font-mono text-lg font-semibold tabular-nums ${score < LOW_FIT_THRESHOLD ? "text-danger" : "text-accent"}`}
      >
        {score}
      </span>
      <span className="font-mono text-[11px] text-faint">/100</span>
    </span>
  );
}

function State({ status }: { status: ApplicationRow["status"] }) {
  return status === "generated" ? (
    <Badge tone="good">Resume ready</Badge>
  ) : (
    <Badge tone="warn">Waiting for answers</Badge>
  );
}

function Actions({ row }: { row: ApplicationRow }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex items-center gap-1.5 lg:justify-end">
      {row.status === "generated" ? (
        <>
          <ButtonLink variant="secondary" size="sm" href={`/applications/${row.id}`}>
            <ChartBar size={14} />
            Analysis
          </ButtonLink>
          <ButtonAnchor variant="secondary" size="sm" href={`/applications/${row.id}/pdf?download=pdf`}>
            <DownloadSimple size={14} />
            PDF
          </ButtonAnchor>
        </>
      ) : (
        <ButtonLink variant="secondary" size="sm" href={`/applications/${row.id}`}>
          <PencilSimple size={14} />
          Continue
        </ButtonLink>
      )}
      <Button
        variant="ghost"
        disabled={pending}
        title="Delete application"
        onClick={() => {
          if (!confirm(`Delete "${row.role}" at ${row.company}? Its resume and PDF are removed for good.`)) return;
          startTransition(async () => {
            await deleteApplication(row.id);
          });
        }}
      >
        <Trash size={16} />
        <span className="sr-only">Delete application</span>
      </Button>
    </div>
  );
}

export function ApplicationsTable({ rows }: { rows: ApplicationRow[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const visible = useMemo(() => filterRows(rows, query, status), [rows, query, status]);
  const counts = summarize(rows);

  const filters: { value: StatusFilter; label: string; count: number }[] = [
    { value: "all", label: "All", count: counts.total },
    { value: "generated", label: "Ready", count: counts.ready },
    { value: "questions", label: "Waiting", count: counts.waiting },
  ];

  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter by state">
          {filters.map((f) => (
            <button
              key={f.value}
              type="button"
              role="tab"
              aria-selected={status === f.value}
              onClick={() => setStatus(f.value)}
              className={`inline-flex items-center gap-1.5 rounded-ui border px-3 py-1.5 text-sm transition-colors ${
                status === f.value
                  ? "border-accent/40 bg-accent-soft text-ink"
                  : "border-line text-muted hover:text-ink"
              }`}
            >
              {f.label}
              <span className="font-mono text-xs text-faint">{f.count}</span>
            </button>
          ))}
        </div>
        <label className="relative w-full sm:w-72">
          <span className="sr-only">Search applications</span>
          <MagnifyingGlass
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search role, company, stack"
            className="h-10 w-full rounded-ui border border-line bg-sunken pl-9 pr-3 text-sm text-ink placeholder:text-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
          />
        </label>
      </div>

      <div className="overflow-hidden rounded-card border border-line bg-raised">
        <div className="hidden grid-cols-[minmax(0,1fr)_110px_170px_120px_250px] gap-4 border-b border-line bg-sunken px-6 py-3 font-mono text-[11px] uppercase tracking-wider text-faint lg:grid">
          <span>Role and company</span>
          <span>Fit</span>
          <span>State</span>
          <span>Created</span>
          <span className="text-right">Actions</span>
        </div>

        {visible.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-faint">No applications match that.</p>
        ) : (
          <ul className="divide-y divide-line">
            {visible.map((row) => (
              <li
                key={row.id}
                className="grid gap-3 px-4 py-4 md:px-6 lg:grid-cols-[minmax(0,1fr)_110px_170px_120px_250px] lg:items-center lg:gap-4"
              >
                <div className="grid min-w-0 gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <a href={`/applications/${row.id}`} className="truncate font-medium hover:text-accent">
                      {row.role}
                    </a>
                    {row.location ? <Badge mono>{row.location}</Badge> : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                    <span className="text-muted">{row.company}</span>
                    {row.stack.length > 0 ? (
                      <span className="font-mono text-xs text-faint">{row.stack.join(" / ")}</span>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 lg:contents">
                  <span>
                    <Fit score={row.score} />
                  </span>
                  <span>
                    <State status={row.status} />
                  </span>
                  <span className="font-mono text-xs text-faint">{dateFormat.format(new Date(row.createdAt))}</span>
                </div>
                <Actions row={row} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
