import type { Metadata } from "next";
import { ArrowSquareOut } from "@phosphor-icons/react/dist/ssr";
import { hnRepository } from "@/container";
import { EmptyState, PageHeader } from "@/components/ui";
import { threadMonth } from "@/domain/hn";
import { getCurrentUser } from "@/infrastructure/auth/session";
import { pageMetadata } from "@/app/seo/site";
import { HnPostList } from "./list";
import { loadHnPage } from "./load";
import { parseWorkMode } from "./rows";

export const metadata: Metadata = pageMetadata({
  title: "HN Who's Hiring",
  description:
    'Job posts from Hacker News\' monthly "Who is hiring?" thread, searchable by role, location and stack, with a tailored CV one click away.',
  path: "/hiring",
});
export const dynamic = "force-dynamic";

export default async function HiringPage({ searchParams }: PageProps<"/hiring">) {
  // Public: anyone can browse. Tailor CV, Save and the Saved tab need a signed-in user.
  const user = await getCurrentUser();
  // Every month's thread stays stored; ?thread= picks one, the latest by default.
  const threads = await hnRepository().listThreads();
  const params = await searchParams;
  const thread = threads.find((t) => String(t.id) === params.thread) ?? threads[0] ?? null;
  const workMode = parseWorkMode(params.mode);
  const search = typeof params.q === "string" ? params.q.slice(0, 200) : "";
  // ?view=saved: the posts this user saved, from every month.
  const view: "all" | "saved" = user && params.view === "saved" ? "saved" : "all";
  const savedCount = user ? await hnRepository().savedCount(user.id) : 0;

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
              , checked for new posts every 3 hours. Tailor a CV for any of them in one click.
            </>
          ) : (
            'Job posts from Hacker News\' monthly "Who is hiring?" thread, checked every 3 hours.'
          )
        }
      />
      {thread ? (
        <HnPostList
          signedIn={Boolean(user)}
          view={view}
          savedCount={savedCount}
          threadId={thread.id}
          months={threads.map((t) => ({ id: t.id, label: threadMonth(t.title) }))}
          latestId={threads[0].id}
          workMode={workMode}
          search={search}
          page={await loadHnPage(user?.id ?? null, view === "saved" ? "saved" : thread.id, workMode, search)}
        />
      ) : (
        <EmptyState title="No posts yet">
          The first check of Hacker News runs a minute after the server starts. Come back shortly.
        </EmptyState>
      )}
    </div>
  );
}
