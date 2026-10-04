import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { applicationRepository, profileRepository } from "@/container";
import { getCurrentUser } from "@/infrastructure/auth/session";
import { Landing } from "./landing";
import { Badge, ButtonLink, EmptyState, PageHeader } from "@/components/ui";
import { LOW_FIT_THRESHOLD } from "@/domain/fit";

export const dynamic = "force-dynamic";

const dateFormat = new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" });

// Signed out: the public landing page. Signed in: your applications.
export default async function HomePage({ searchParams }: PageProps<"/">) {
  const user = await getCurrentUser();
  if (!user) return <Landing error={(await searchParams).error as string | undefined} />;

  const [apps, profile] = await Promise.all([
    applicationRepository().list(user.id),
    profileRepository().findByUser(user.id),
  ]);

  return (
    <div className="grid gap-10">
      <PageHeader
        title="Applications"
        description="Every job you tailored a resume for, newest first."
        action={<ButtonLink href={profile ? "/new" : "/profile"}>New application</ButtonLink>}
      />

      {apps.length === 0 ? (
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
            ? "Paste a job description and you'll get a fit score, a few questions, then a tailored resume PDF."
            : "Start by adding your profile. Every resume is built only from what's in it."}
        </EmptyState>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-raised">
          {apps.map((app) => (
            <li key={app.id}>
              <Link
                href={`/applications/${app.id}`}
                className="grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-1 px-4 py-4 transition-colors hover:bg-sunken md:grid-cols-[1fr_auto_auto_auto] md:px-6"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{app.role}</span>
                  <span className="block truncate text-sm text-muted">{app.company}</span>
                </span>
                <span
                  className={`font-mono text-lg font-semibold tabular-nums ${
                    app.fit.score < LOW_FIT_THRESHOLD ? "text-danger" : "text-accent"
                  }`}
                >
                  {app.fit.score}
                </span>
                <span className="hidden md:block">
                  {app.status === "generated" ? (
                    <Badge tone="good">Resume ready</Badge>
                  ) : (
                    <Badge tone="warn">Waiting for answers</Badge>
                  )}
                </span>
                <span className="hidden font-mono text-sm text-faint md:block">{dateFormat.format(app.createdAt)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
