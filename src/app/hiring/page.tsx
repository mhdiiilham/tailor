import type { Metadata } from "next";
import { ArrowSquareOut } from "@phosphor-icons/react/dist/ssr";
import { hnRepository } from "@/container";
import { EmptyState, PageHeader } from "@/components/ui";
import { threadMonth } from "@/domain/hn";
import { requireUser } from "@/infrastructure/auth/session";
import { HnPostList } from "./list";
import { loadHnPage } from "./load";
import { parseWorkMode } from "./rows";

export const metadata: Metadata = { title: "HN Who's Hiring" };
export const dynamic = "force-dynamic";

export default async function HiringPage({ searchParams }: PageProps<"/hiring">) {
  await requireUser();
  // Every month's thread stays stored; ?thread= picks one, the latest by default.
  const threads = await hnRepository().listThreads();
  const params = await searchParams;
  const thread = threads.find((t) => String(t.id) === params.thread) ?? threads[0] ?? null;
  const workMode = parseWorkMode(params.mode);
  const search = typeof params.q === "string" ? params.q.slice(0, 200) : "";

  return (
    <div className="grid grid-cols-1 gap-8">
      <PageHeader
        title="HN Who's Hiring"
        description={
          thread ? (
            <>
              Job posts from{" "}
              <a
                href={`https://news.ycombinator.com/item?id=${thread.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-accent hover:underline"
              >
                {thread.title.replace(/^Ask HN:\s*/i, "")}
                <ArrowSquareOut size={13} />
              </a>
              , checked for new posts every hour. Tailor a CV for any of them in one click.
            </>
          ) : (
            'Job posts from Hacker News\' monthly "Who is hiring?" thread, checked every hour.'
          )
        }
      />
      {thread ? (
        <HnPostList
          threadId={thread.id}
          months={threads.map((t) => ({ id: t.id, label: threadMonth(t.title) }))}
          latestId={threads[0].id}
          workMode={workMode}
          search={search}
          page={await loadHnPage(thread.id, workMode, search)}
        />
      ) : (
        <EmptyState title="No posts yet">
          The first check of Hacker News runs a minute after the server starts. Come back shortly.
        </EmptyState>
      )}
    </div>
  );
}
