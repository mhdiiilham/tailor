import type { Metadata } from "next";
import { ArrowLeft, ArrowSquareOut, BookmarkSimple, MagicWand } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { notFound } from "next/navigation";
import { pageMetadata } from "@/app/seo/site";
import { Badge, ButtonAnchor, ButtonLink, Card, PageHeader } from "@/components/ui";
import { hnRepository } from "@/container";
import { hnPostPath, hnPostTitle, parseHnPostId, safeUrl } from "@/domain/hn";
import { getCurrentUser } from "@/infrastructure/auth/session";
import { CopyLinkButton, FitBadge, OriginalPost, SaveButton } from "../postParts";
import { MODE_LABEL, MODE_TONE, signInHref } from "../shared";

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
  const applyUrl = job ? safeUrl(job.applyUrl) : "";
  const facts = [
    job && job.workMode !== "unknown"
      ? { label: "Work mode", value: <Badge tone={MODE_TONE[job.workMode]}>{MODE_LABEL[job.workMode]}</Badge> }
      : null,
    job?.location
      ? { label: "Location", value: <span className="text-sm [overflow-wrap:anywhere]">{job.location}</span> }
      : null,
    job?.salary
      ? { label: "Pay", value: <span className="font-mono text-sm [overflow-wrap:anywhere]">{job.salary}</span> }
      : null,
  ].filter((f) => f !== null);

  return (
    <div className="grid grid-cols-1 gap-8">
      <div className="grid gap-4">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1.5 justify-self-start text-sm text-muted hover:text-ink"
        >
          <ArrowLeft size={14} />
          All jobs
        </Link>
        <PageHeader
          title={hnPostTitle(post.text, job)}
          description={`Posted ${dateFormat.format(post.postedAt)} by ${post.author} on Hacker News's "Who is hiring?" thread.`}
        />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        {/* The actions come first on a phone, and sit beside the post on a wide screen. */}
        <aside className="grid gap-6 lg:sticky lg:top-6 lg:col-start-2 lg:row-start-1">
          <Card>
            <ButtonLink
              href={user ? tailorHref : signInHref(tailorHref)}
              title={user ? undefined : "Sign in to tailor a CV for this job"}
            >
              <MagicWand size={16} />
              Tailor CV
            </ButtonLink>
            {applyUrl ? (
              <ButtonAnchor variant="secondary" href={applyUrl} target="_blank" rel="noopener noreferrer">
                Apply
                <ArrowSquareOut size={14} />
              </ButtonAnchor>
            ) : null}
            <div className="flex flex-wrap items-center gap-1 border-t border-line pt-3">
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
              <a
                href={`https://news.ycombinator.com/item?id=${post.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 items-center gap-1.5 rounded-ui px-2 text-xs text-muted hover:text-ink"
              >
                View on HN
                <ArrowSquareOut size={12} />
              </a>
            </div>
          </Card>

          {facts.length || job?.techStack.length ? (
            <Card>
              <h2 className="text-sm font-medium">Details</h2>
              {facts.length ? (
                <dl className="grid gap-3 border-t border-line pt-4">
                  {facts.map((f) => (
                    <div key={f.label} className="grid gap-1">
                      <dt className="font-mono text-xs uppercase text-faint">{f.label}</dt>
                      <dd>{f.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
              {job?.techStack.length ? (
                <div className="grid gap-2 border-t border-line pt-4">
                  <p className="font-mono text-xs uppercase text-faint">Stack</p>
                  <div className="flex flex-wrap gap-1.5">
                    {job.techStack.map((t) => (
                      <FitBadge key={t} mono>
                        {t}
                      </FitBadge>
                    ))}
                  </div>
                </div>
              ) : null}
            </Card>
          ) : null}
        </aside>

        <Card className="min-w-0 lg:col-start-1 lg:row-start-1" aria-label="The post as written on Hacker News">
          <OriginalPost text={post.text} scroll={false} />
        </Card>
      </div>
    </div>
  );
}
