import type { Metadata } from "next";
import Link from "next/link";
import { cache, Suspense } from "react";
import { ArrowRight, Lightning, Plus } from "@phosphor-icons/react/dist/ssr";
import { applicationRepository, profileRepository } from "@/container";
import { getCurrentUser } from "@/infrastructure/auth/session";
import { ButtonLink, Card, EmptyState, PageHeader } from "@/components/ui";
import { ApplicationsTable } from "./dashboard/applicationsTable";
import { summarize, toRow } from "./dashboard/rows";
import { ApplicationsTableSkeleton, StatusStripSkeleton } from "./dashboard/skeletons";
import { StatusStrip } from "./dashboard/statusStrip";
import { Landing } from "./landing";
import { SITE_DESCRIPTION, pageMetadata } from "./seo/site";
import { NewApplicationForm } from "./new/form";

export const dynamic = "force-dynamic";

// "/?error=..." after a refused sign-in is the same page.
export const metadata: Metadata = pageMetadata({ description: SITE_DESCRIPTION, path: "/" });

// The strip and the table both need the list; cache() makes it one query per request.
const loadRows = cache(async (userId: string) => (await applicationRepository().list(userId)).map(toRow));

async function Strip({ userId }: { userId: string }) {
  return <StatusStrip {...summarize(await loadRows(userId))} />;
}

async function List({ userId, hasProfile }: { userId: string; hasProfile: boolean }) {
  const rows = await loadRows(userId);
  if (rows.length > 0) return <ApplicationsTable rows={rows} />;
  return (
    <EmptyState
      title="Nothing here yet"
      actions={
        <Link href={hasProfile ? "/new" : "/profile"} className="inline-flex items-center gap-1.5 text-accent">
          {hasProfile ? "Paste a job description" : "Set up your profile"}
          <ArrowRight size={14} weight="bold" />
        </Link>
      }
    >
      {hasProfile
        ? "Your applications will show up here with their fit score and resume."
        : "Start by adding your profile. Every resume is built only from what's in it."}
    </EmptyState>
  );
}

// Signed out: the public landing page. Signed in: your applications. The header and
// the quick-paste box render right away; the list streams in behind skeletons.
export default async function HomePage({ searchParams }: PageProps<"/">) {
  const user = await getCurrentUser();
  if (!user) return <Landing error={(await searchParams).error as string | undefined} />;

  const profile = await profileRepository().findByUser(user.id);

  return (
    <div className="grid gap-8">
      <Suspense fallback={<StatusStripSkeleton />}>
        <Strip userId={user.id} />
      </Suspense>

      <PageHeader
        title="Applications"
        description="Every job you tailored a resume for, newest first."
        action={
          <ButtonLink href={profile ? "/new" : "/profile"}>
            <Plus size={16} weight="bold" />
            New application
          </ButtonLink>
        }
      />

      {profile ? (
        <Card className="lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-start lg:gap-8">
          <div className="grid gap-2">
            <h2 className="flex items-center gap-2 text-lg font-medium">
              <Lightning size={18} weight="fill" className="text-accent" />
              Tailor a new application
            </h2>
            <p className="max-w-[52ch] text-sm leading-relaxed text-muted">
              Paste a job description. You’ll get a fit score and a few questions, then a one-page resume built only
              from your profile.
            </p>
          </div>
          <NewApplicationForm profile={profile.profile} />
        </Card>
      ) : null}

      <Suspense fallback={<ApplicationsTableSkeleton />}>
        <List userId={user.id} hasProfile={Boolean(profile)} />
      </Suspense>
    </div>
  );
}
