import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { applicationRepository, profileRepository } from "@/container";
import { getCurrentUser } from "@/infrastructure/auth/session";
import { Landing } from "./landing";
import { EmptyState, PageHeader, ButtonLink } from "@/components/ui";

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
        <ul className="divide-y divide-line border-y border-line">
          {apps.map((app) => (
            <li key={app.id}>
              <Link
                href={`/applications/${app.id}`}
                className="grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-1 py-4 transition-colors hover:bg-raised md:grid-cols-[1fr_auto_auto_auto] md:px-3"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{app.role}</span>
                  <span className="block truncate text-sm text-muted">{app.company}</span>
                </span>
                <span className="font-mono text-lg tabular-nums">{app.fit.score}</span>
                <span className="hidden text-sm text-muted md:block">
                  {app.status === "generated" ? "Resume ready" : "Waiting for answers"}
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
