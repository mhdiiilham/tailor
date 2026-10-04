import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { applicationRepository, profileRepository } from "@/container";
import { buttonStyles } from "@/components/styles";

export const dynamic = "force-dynamic";

const dateFormat = new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" });

export default async function ApplicationsPage() {
  const [apps, profile] = await Promise.all([applicationRepository().list(), profileRepository().findDefault()]);

  return (
    <div className="grid gap-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">Applications</h1>
          <p className="max-w-[60ch] text-muted">Every job you tailored a resume for, newest first.</p>
        </div>
        <Link href={profile ? "/new" : "/profile"} className={buttonStyles.primary}>
          New application
        </Link>
      </div>

      {apps.length === 0 ? (
        <div className="grid max-w-xl gap-3 rounded-ui border border-dashed border-line p-8">
          <h2 className="text-lg font-medium">Nothing here yet</h2>
          <p className="text-muted">
            {profile
              ? "Paste a job description and you'll get a fit score, a few questions, then a tailored resume PDF."
              : "Start by importing your profile. Every resume is built only from what's in it."}
          </p>
          <Link href={profile ? "/new" : "/profile"} className="inline-flex items-center gap-1.5 text-sm font-medium text-accent">
            {profile ? "Paste a job description" : "Set up your profile"}
            <ArrowRight size={14} weight="bold" />
          </Link>
        </div>
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
