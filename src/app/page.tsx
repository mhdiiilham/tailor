import Link from "next/link";
import { ArrowRight, Lightning, Plus } from "@phosphor-icons/react/dist/ssr";
import { applicationRepository, profileRepository } from "@/container";
import { getCurrentUser } from "@/infrastructure/auth/session";
import { ButtonLink, Card, EmptyState, PageHeader } from "@/components/ui";
import { ApplicationsTable } from "./dashboard/applicationsTable";
import { summarize, toRow } from "./dashboard/rows";
import { StatusStrip } from "./dashboard/statusStrip";
import { Landing } from "./landing";
import { NewApplicationForm } from "./new/form";

export const dynamic = "force-dynamic";

// Signed out: the public landing page. Signed in: your applications.
export default async function HomePage({ searchParams }: PageProps<"/">) {
  const user = await getCurrentUser();
  if (!user) return <Landing error={(await searchParams).error as string | undefined} />;

  const [apps, profile] = await Promise.all([
    applicationRepository().list(user.id),
    profileRepository().findByUser(user.id),
  ]);
  const rows = apps.map(toRow);
  const { total, averageFit } = summarize(rows);

  return (
    <div className="grid gap-8">
      <StatusStrip total={total} averageFit={averageFit} />

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
          <NewApplicationForm compact />
        </Card>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState
          title="Nothing here yet"
          actions={
            <Link href={profile ? "/new" : "/profile"} className="inline-flex items-center gap-1.5 text-accent">
              {profile ? "Paste a job description" : "Set up your profile"}
              <ArrowRight size={14} weight="bold" />
            </Link>
          }
        >
          {profile
            ? "Your applications will show up here with their fit score and resume."
            : "Start by adding your profile. Every resume is built only from what's in it."}
        </EmptyState>
      ) : (
        <ApplicationsTable rows={rows} />
      )}
    </div>
  );
}
