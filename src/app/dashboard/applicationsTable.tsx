"use client";

import { ArrowRight, ChartBar, DownloadSimple, MagnifyingGlass, PencilSimple, Trash } from "@phosphor-icons/react";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { deleteApplication, loadApplications } from "@/app/actions";
import { Badge, Button, ButtonAnchor, ButtonLink, FormMessage } from "@/components/ui";
import { LOW_FIT_THRESHOLD } from "@/domain/fit";
import type { StageFilter } from "@/domain/stage";
import { StageSelect } from "@/components/stageSelect";
import type { ApplicationRow, RowPage } from "./rows";

const dateFormat = new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" });

function Fit({ score }: { score: number | null }) {
  if (score === null) {
    return (
      <span className="font-mono text-sm text-faint" title="Not analyzed: added only to track it">
        —
      </span>
    );
  }
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

function Actions({ row, onDeleted }: { row: ApplicationRow; onDeleted: (id: number) => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex items-center gap-1.5 lg:justify-end">
      {row.status === "tracked" ? (
        <ButtonLink variant="secondary" size="sm" href={`/applications/${row.id}`}>
          <ArrowRight size={14} />
          Open
        </ButtonLink>
      ) : row.status === "generated" ? (
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
            const result = await deleteApplication(row.id);
            if (result.error) return alert(result.error);
            onDeleted(row.id);
            router.refresh(); // updates the counts
          });
        }}
      >
        <Trash size={16} />
        <span className="sr-only">Delete application</span>
      </Button>
    </div>
  );
}

const FILTERS: { value: StageFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "not_applied", label: "Not applied" },
  { value: "applied", label: "Applied" },
  { value: "interviewing", label: "Interviewing" },
  { value: "offer", label: "Offer" },
  { value: "closed", label: "Closed" },
];

type Props = { stage: StageFilter; search: string; counts: Record<StageFilter, number>; page: RowPage };

// Stage and search live in the URL, so the server renders the matching first page.
// The tab counts cover every application, not just the loaded pages.
export function ApplicationsTable({ stage, search, counts, page }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(search);
  const [updating, startUpdate] = useTransition();
  const typing = useRef<ReturnType<typeof setTimeout>>(undefined);

  function show(next: { stage?: StageFilter; q?: string }) {
    const params = new URLSearchParams();
    const nextStage = next.stage ?? stage;
    const nextQuery = (next.q ?? query).trim();
    if (nextStage !== "all") params.set("stage", nextStage);
    if (nextQuery) params.set("q", nextQuery);
    const url = params.size ? `${pathname}?${params}` : pathname;
    startUpdate(() => router.replace(url, { scroll: false }));
  }

  // Waits until typing pauses, so each keystroke isn't a request.
  function changeQuery(value: string) {
    setQuery(value);
    clearTimeout(typing.current);
    typing.current = setTimeout(() => show({ q: value }), 300);
  }

  // A new first page from the server (filter change, stage change, refresh) starts the list over.
  const pageKey = [stage, search, page.nextCursor, ...page.rows.map((r) => `${r.id}:${r.stage}:${r.status}`)].join("|");

  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter by state">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              role="tab"
              aria-selected={stage === f.value}
              onClick={() => show({ stage: f.value })}
              className={`inline-flex items-center gap-1.5 rounded-ui border px-3 py-1.5 text-sm transition-colors ${
                stage === f.value ? "border-accent/40 bg-accent-soft text-ink" : "border-line text-muted hover:text-ink"
              }`}
            >
              {f.label}
              <span className="font-mono text-xs text-faint">{counts[f.value]}</span>
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
            onChange={(e) => changeQuery(e.target.value)}
            placeholder="Search role, company, stack"
            className="h-10 w-full rounded-ui border border-line bg-sunken pl-9 pr-3 text-sm text-ink placeholder:text-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
          />
        </label>
      </div>

      <div className={`transition-opacity ${updating ? "opacity-60" : ""}`} aria-busy={updating}>
        <PagedRows key={pageKey} first={page} stage={stage} search={search} total={search ? null : counts[stage]} />
      </div>
    </section>
  );
}

// The loaded rows: the server's first page plus any pages added with "Load more".
function PagedRows({
  first,
  stage,
  search,
  total,
}: {
  first: RowPage;
  stage: StageFilter;
  search: string;
  total: number | null;
}) {
  const [rows, setRows] = useState(first.rows);
  const [cursor, setCursor] = useState(first.nextCursor);
  const [error, setError] = useState<string>();
  const [loading, startLoading] = useTransition();

  function loadMore() {
    setError(undefined);
    startLoading(async () => {
      const next = await loadApplications({ stage, search, cursor });
      if (next.error) return setError(next.error);
      setRows((current) => [...current, ...next.rows.filter((r) => !current.some((c) => c.id === r.id))]);
      setCursor(next.nextCursor);
    });
  }

  const removeRow = (id: number) => setRows((current) => current.filter((r) => r.id !== id));

  return (
    <div className="grid gap-4">
      <div className="overflow-hidden rounded-card border border-line bg-raised">
        <div className="hidden grid-cols-[minmax(0,1fr)_110px_160px_120px_250px] gap-4 border-b border-line bg-sunken px-6 py-3 font-mono text-[11px] uppercase tracking-wider text-faint lg:grid">
          <span>Role and company</span>
          <span>Fit</span>
          <span>Progress</span>
          <span>Applied</span>
          <span className="text-right">Actions</span>
        </div>

        {rows.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-faint">No applications match that.</p>
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((row) => (
              <Row key={row.id} row={row} onDeleted={removeRow} />
            ))}
          </ul>
        )}
      </div>

      {rows.length > 0 ? (
        <div className="grid justify-items-center gap-2">
          {cursor ? (
            <Button variant="secondary" disabled={loading} onClick={loadMore}>
              {loading ? "Loading..." : "Load more"}
            </Button>
          ) : null}
          <p className="font-mono text-xs text-faint">
            Showing {rows.length}
            {total !== null ? ` of ${total}` : ""}
          </p>
          <FormMessage error={error} />
        </div>
      ) : null}
    </div>
  );
}

function Row({ row, onDeleted }: { row: ApplicationRow; onDeleted: (id: number) => void }) {
  return (
    <li className="grid gap-3 px-4 py-4 md:px-6 lg:grid-cols-[minmax(0,1fr)_110px_160px_120px_250px] lg:items-center lg:gap-4">
      <div className="grid min-w-0 gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <a href={`/applications/${row.id}`} className="truncate font-medium hover:text-accent">
            {row.role}
          </a>
          {row.location ? (
            <span className="flex min-w-0 max-w-64">
              <Badge mono truncate>
                {row.location}
              </Badge>
            </span>
          ) : null}
          {row.status === "questions" ? <Badge tone="warn">Answer questions</Badge> : null}
          {row.status === "tracked" ? <Badge>Tracked</Badge> : null}
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span className="text-muted">{row.company}</span>
          {row.stack.length > 0 ? <span className="font-mono text-xs text-faint">{row.stack.join(" / ")}</span> : null}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 lg:contents">
        <span>
          <Fit score={row.score} />
        </span>
        <span>
          <StageSelect id={row.id} stage={row.stage} label={`Stage for ${row.role}`} />
        </span>
        <span className="font-mono text-xs text-faint">
          {row.appliedAt ? dateFormat.format(new Date(row.appliedAt)) : "Not yet"}
        </span>
      </div>
      <Actions row={row} onDeleted={onDeleted} />
    </li>
  );
}
