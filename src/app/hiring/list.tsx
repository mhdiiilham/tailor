"use client";

import { ArrowSquareOut, BookmarkSimple, MagicWand, MagnifyingGlass } from "@phosphor-icons/react";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { loadHnPosts, setHnPostSaved } from "@/app/actions";
import { Badge, Button, ButtonLink, FormMessage, Select, type BadgeTone } from "@/components/ui";
import { safeUrl, type WorkMode } from "@/domain/hn";
import { splitLinks } from "@/domain/linkify";
import type { HnPostRow, HnRowPage, HnSource, WorkModeFilter } from "./rows";

const FILTERS: { value: WorkModeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "Onsite" },
];

const MODE_LABEL: Record<WorkMode, string> = { remote: "Remote", hybrid: "Hybrid", onsite: "Onsite", unknown: "" };
const MODE_TONE: Record<WorkMode, BadgeTone> = {
  remote: "good",
  hybrid: "accent",
  onsite: "neutral",
  unknown: "neutral",
};

const dateFormat = new Intl.DateTimeFormat("en", { day: "numeric", month: "short" });

type Props = {
  view: "all" | "saved";
  savedCount: number;
  threadId: number;
  months: { id: number; label: string }[];
  latestId: number;
  workMode: WorkModeFilter;
  search: string;
  page: HnRowPage;
};

// Filter and search live in the URL, so the server renders the matching first page.
export function HnPostList({ view, savedCount, threadId, months, latestId, workMode, search, page }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(search);
  const [updating, startUpdate] = useTransition();
  const typing = useRef<ReturnType<typeof setTimeout>>(undefined);

  function show(next: { mode?: WorkModeFilter; q?: string; thread?: number; view?: "all" | "saved" }) {
    const params = new URLSearchParams();
    const nextView = next.view ?? view;
    if (nextView === "saved") params.set("view", "saved");
    const mode = next.mode ?? workMode;
    const q = (next.q ?? query).trim();
    const thread = next.thread ?? threadId;
    if (thread !== latestId && nextView === "all") params.set("thread", String(thread));
    if (mode !== "all") params.set("mode", mode);
    if (q) params.set("q", q);
    startUpdate(() => router.replace(params.size ? `${pathname}?${params}` : pathname, { scroll: false }));
  }

  // Waits until typing pauses, so each keystroke isn't a request.
  function changeQuery(value: string) {
    setQuery(value);
    clearTimeout(typing.current);
    typing.current = setTimeout(() => show({ q: value }), 300);
  }

  const source: HnSource = view === "saved" ? "saved" : threadId;
  const pageKey = [source, workMode, search, page.nextCursor, ...page.rows.map((r) => `${r.id}:${r.job ? 1 : 0}`)].join(
    "|",
  );

  return (
    <section className="grid min-w-0 grid-cols-1 gap-4">
      <div className="flex gap-1 border-b border-line text-sm" role="tablist" aria-label="Posts to show">
        {(
          [
            ["all", "All posts"],
            ["saved", "Saved"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={view === value}
            onClick={() => show({ view: value })}
            className={`-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2.5 ${
              view === value ? "border-accent text-ink" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {label}
            {value === "saved" ? <span className="font-mono text-xs text-faint">{savedCount}</span> : null}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter by work mode">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              role="tab"
              aria-selected={workMode === f.value}
              onClick={() => show({ mode: f.value })}
              className={`rounded-ui border px-3 py-1.5 text-sm transition-colors ${
                workMode === f.value
                  ? "border-accent/40 bg-accent-soft text-ink"
                  : "border-line text-muted hover:text-ink"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          {/* Earlier months stay stored; the picker appears once there's more than one. */}
          {view === "all" && months.length > 1 ? (
            <span className="w-full sm:w-44">
              <Select
                aria-label="Month"
                value={threadId}
                onChange={(e) => show({ thread: Number(e.target.value) })}
                className="h-10 py-0 text-sm"
              >
                {months.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </Select>
            </span>
          ) : null}
          <label className="relative w-full sm:w-80">
            <span className="sr-only">Search job posts</span>
            <MagnifyingGlass
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => changeQuery(e.target.value)}
              placeholder="Search company, role, location, stack"
              className="h-10 w-full rounded-ui border border-line bg-sunken pl-9 pr-3 text-sm text-ink placeholder:text-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
            />
          </label>
        </div>
      </div>

      <div className={`transition-opacity ${updating ? "opacity-60" : ""}`} aria-busy={updating}>
        <PagedPosts key={pageKey} source={source} first={page} workMode={workMode} search={search} />
      </div>
    </section>
  );
}

function PagedPosts({
  source,
  first,
  workMode,
  search,
}: {
  source: HnSource;
  first: HnRowPage;
  workMode: WorkModeFilter;
  search: string;
}) {
  const [rows, setRows] = useState(first.rows);
  const [cursor, setCursor] = useState(first.nextCursor);
  const [error, setError] = useState<string>();
  const [loading, startLoading] = useTransition();

  function loadMore() {
    setError(undefined);
    startLoading(async () => {
      const next = await loadHnPosts({ source, workMode, search, cursor });
      if (next.error) return setError(next.error);
      setRows((current) => [...current, ...next.rows.filter((r) => !current.some((c) => c.id === r.id))]);
      setCursor(next.nextCursor);
    });
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-card border border-line bg-raised px-6 py-10 text-center text-sm text-faint">
        {source === "saved" && !search && workMode === "all"
          ? "Nothing saved yet. Use Save on any post to keep it here."
          : "No posts match that."}
      </p>
    );
  }

  return (
    <div className="grid gap-4">
      <ul className="grid grid-cols-1 gap-3">
        {rows.map((row) => (
          <PostCard key={row.id} row={row} />
        ))}
      </ul>
      <div className="grid justify-items-center gap-2">
        {cursor ? (
          <Button variant="secondary" disabled={loading} onClick={loadMore}>
            {loading ? "Loading..." : "Load more"}
          </Button>
        ) : null}
        <p className="font-mono text-xs text-faint">Showing {rows.length}</p>
        <FormMessage error={error} />
      </div>
    </div>
  );
}

function PostCard({ row }: { row: HnPostRow }) {
  const job = row.job;
  // Before parsing, the post's first line stands in for company and role.
  const [firstLine, ...rest] = row.text.split("\n");
  const titled = Boolean(job?.company || job?.role);
  // When the first line is the title, the preview starts after it.
  const preview = titled ? row.text : rest.join("\n").trim();

  return (
    <li className="grid min-w-0 grid-cols-1 gap-3 rounded-card border border-line bg-raised p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid min-w-0 gap-1">
          {job && titled ? (
            <>
              <p className="font-medium">{job.role || "Open roles"}</p>
              <p className="text-sm text-muted">{job.company}</p>
            </>
          ) : (
            <p className="[overflow-wrap:anywhere] font-medium">{firstLine.slice(0, 160)}</p>
          )}
        </div>
        <span className="font-mono text-xs text-faint">{dateFormat.format(new Date(row.postedAt))}</span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {job && job.workMode !== "unknown" ? (
          <Badge tone={MODE_TONE[job.workMode]}>{MODE_LABEL[job.workMode]}</Badge>
        ) : null}
        {job?.location ? <FitBadge>{job.location}</FitBadge> : null}
        {job?.salary ? <FitBadge mono>{job.salary}</FitBadge> : null}
        {job?.techStack.slice(0, 8).map((t) => (
          <FitBadge key={t} mono>
            {t}
          </FitBadge>
        ))}
        {!job ? <Badge tone="warn">Not parsed yet</Badge> : null}
      </div>

      <details className="group">
        <summary className="cursor-pointer list-none text-sm text-muted">
          {preview ? (
            <span className="line-clamp-3 whitespace-pre-line [overflow-wrap:anywhere] group-open:hidden">
              {preview}
            </span>
          ) : null}
          <span className="mt-1 inline-block text-accent group-open:hidden">Show original post</span>
          <span className="hidden text-accent group-open:inline">Hide original post</span>
        </summary>
        <div className="mt-3 grid gap-3 rounded-ui border border-line bg-sunken p-4">
          <OriginalPost text={row.text} />
          <a
            href={`https://news.ycombinator.com/item?id=${row.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 justify-self-start text-xs text-accent hover:underline"
          >
            Posted by {row.author} on Hacker News
            <ArrowSquareOut size={12} />
          </a>
        </div>
      </details>

      <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
        <ButtonLink size="sm" href={`/new?hn=${row.id}`}>
          <MagicWand size={14} />
          Tailor CV
        </ButtonLink>
        {job && safeUrl(job.applyUrl) ? (
          <a
            href={safeUrl(job.applyUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center gap-1.5 rounded-ui border border-line px-3 text-xs font-medium hover:bg-sunken"
          >
            Apply
            <ArrowSquareOut size={12} />
          </a>
        ) : null}
        <a
          href={`https://news.ycombinator.com/item?id=${row.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-8 items-center gap-1.5 px-2 text-xs text-muted hover:text-ink"
        >
          View on HN
          <ArrowSquareOut size={12} />
        </a>
        <SaveButton postId={row.id} initial={row.saved} />
        <span className="ml-auto font-mono text-xs text-faint">by {row.author}</span>
      </div>
    </li>
  );
}

// The post as written on HN: its paragraphs, with every web link clickable. The text
// is plain (converted when it was fetched), so nothing in it is rendered as HTML.
function OriginalPost({ text }: { text: string }) {
  return (
    <div className="grid max-h-[560px] gap-3 overflow-y-auto pr-1 text-sm leading-relaxed text-ink">
      {text.split(/\n{2,}/).map((paragraph, i) => (
        <p key={i} className="whitespace-pre-wrap [overflow-wrap:anywhere]">
          {splitLinks(paragraph).map((part, j) =>
            part.href ? (
              <a
                key={j}
                href={part.href}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="text-accent underline decoration-accent/40 hover:decoration-accent"
              >
                {part.text}
              </a>
            ) : (
              part.text
            ),
          )}
        </p>
      ))}
    </div>
  );
}

// Saves the post to the user's list (or removes it), right away, undoing on failure.
function SaveButton({ postId, initial }: { postId: number; initial: boolean }) {
  const router = useRouter();
  const [saved, setSaved] = useState(initial);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !saved;
    setSaved(next);
    startTransition(async () => {
      const result = await setHnPostSaved(postId, next);
      if (result.error) {
        setSaved(!next);
        alert(result.error);
      } else {
        router.refresh(); // updates the Saved count
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={saved}
      className={`inline-flex h-8 items-center gap-1.5 rounded-ui px-2 text-xs transition-colors disabled:opacity-60 ${
        saved ? "text-accent" : "text-muted hover:text-ink"
      }`}
    >
      <BookmarkSimple size={14} weight={saved ? "fill" : "regular"} />
      {saved ? "Saved" : "Save"}
    </button>
  );
}

// A badge that never gets wider than the card: Gemini sometimes copies a whole sentence
// into a field (a salary note, a long location), and badges don't wrap. Anything too
// long is cut with "…"; the full text shows on hover.
function FitBadge({ mono = false, children }: { mono?: boolean; children: string }) {
  return (
    <span className="flex min-w-0 max-w-full sm:max-w-80">
      <Badge mono={mono} truncate>
        {children}
      </Badge>
    </span>
  );
}
