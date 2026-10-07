import type { Metadata } from "next";
import { ArrowLeft, ArrowSquareOut, BookmarkSimple, MagicWand } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { notFound } from "next/navigation";
import { pageMetadata } from "@/app/seo/site";
import { Badge, ButtonLink } from "@/components/ui";
import { hnRepository } from "@/container";
import { hnPostPath, hnPostTitle, parseHnPostId, safeUrl } from "@/domain/hn";
import { getCurrentUser } from "@/infrastructure/auth/session";
import { CopyLinkButton, FitBadge, MODE_LABEL, MODE_TONE, OriginalPost, SaveButton, signInHref } from "../postParts";

export const dynamic = "force-dynamic";

const dateFormat = new Intl.DateTimeFormat("en", { day: "numeric", month: "long", year: "numeric" });

async function loadPost(rawId: string) {
  const id = parseHnPostId(rawId);
  return id === null ? null : await hnRepository().findPost(id);
}

export async function generateMetadata({ params }: PageProps<"/jobs/[id]">): Promise<Metadata> {
  const post = await loadPost((await params).id);
  if (!post) return { title: "Job not found" };
  return pageMetadata({
    title: hnPostTitle(post.text, post.job),
    description: post.text.replace(/\s+/g, " ").slice(0, 160),
    path: hnPostPath(post.id),
  });
}

// One job post on its own page, so a link to it can be shared. Public, like the list.
export default async function JobPage({ params }: PageProps<"/jobs/[id]">) {
  const post = await loadPost((await params).id);
  if (!post) notFound();

  const user = await getCurrentUser();
  const saved = user ? (await hnRepository().savedIds(user.id, [post.id])).includes(post.id) : false;
  const job = post.job;
  const tailorHref = `/new?hn=${post.id}`;
  const hnUrl = `https://news.ycombinator.com/item?id=${post.id}`;

  return (
    <article className="mx-auto grid w-full max-w-3xl gap-6">
      <Link
        href="/jobs"
        className="inline-flex items-center gap-1.5 justify-self-start text-sm text-muted hover:text-ink"
      >
        <ArrowLeft size={14} />
        All jobs
      </Link>

      <header className="grid gap-3">
        <h1 className="text-2xl font-medium [overflow-wrap:anywhere]">{hnPostTitle(post.text, job)}</h1>
        <p className="font-mono text-xs text-faint">
          Posted {dateFormat.format(post.postedAt)} by {post.author}
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          {job && job.workMode !== "unknown" ? (
            <Badge tone={MODE_TONE[job.workMode]}>{MODE_LABEL[job.workMode]}</Badge>
          ) : null}
          {job?.location ? <FitBadge>{job.location}</FitBadge> : null}
          {job?.salary ? <FitBadge mono>{job.salary}</FitBadge> : null}
          {job?.techStack.map((t) => (
            <FitBadge key={t} mono>
              {t}
            </FitBadge>
          ))}
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2 border-y border-line py-3">
        <ButtonLink
          size="sm"
          href={user ? tailorHref : signInHref(tailorHref)}
          title={user ? undefined : "Sign in to tailor a CV for this job"}
        >
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
          href={hnUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-8 items-center gap-1.5 px-2 text-xs text-muted hover:text-ink"
        >
          View on HN
          <ArrowSquareOut size={12} />
        </a>
        {user ? (
          <SaveButton postId={post.id} initial={saved} />
        ) : (
          <a
            href={signInHref(hnPostPath(post.id))}
            title="Sign in to save posts"
            className="inline-flex h-8 items-center gap-1.5 rounded-ui px-2 text-xs text-muted hover:text-ink"
          >
            <BookmarkSimple size={14} />
            Save
          </a>
        )}
        <CopyLinkButton postId={post.id} />
      </div>

      <section
        className="rounded-card border border-line bg-raised p-5 md:p-6"
        aria-label="The post as written on Hacker News"
      >
        <OriginalPost text={post.text} scroll={false} />
      </section>
    </article>
  );
}
