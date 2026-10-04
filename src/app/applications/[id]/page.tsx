import { createHash } from "node:crypto";
import { notFound } from "next/navigation";
import { Check, CircleHalf, Minus } from "@phosphor-icons/react/dist/ssr";
import { applicationRepository, profileRepository } from "@/container";
import { LOW_FIT_THRESHOLD, type FitAnalysis, type Match } from "@/domain/fit";
import { resumeFileName } from "@/domain/slug";
import { requireUser } from "@/infrastructure/auth/session";
import { ButtonAnchor, Card, PageHeader, SectionHeader } from "@/components/ui";
import { QuestionsForm, ReviseForm } from "./forms";

export const dynamic = "force-dynamic";

const GROUPS: { match: Match; label: string; icon: typeof Check }[] = [
  { match: "HAVE", label: "You have", icon: Check },
  { match: "PARTIAL", label: "Partly", icon: CircleHalf },
  { match: "MISSING", label: "Missing", icon: Minus },
];

function matchedItems(fit: FitAnalysis) {
  const seen = new Set<string>();
  return [...fit.requirements, ...fit.techStack].filter((i) => {
    const key = i.item.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default async function ApplicationPage({ params }: PageProps<"/applications/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  const app = await applicationRepository().findById(user.id, Number(id));
  if (!app) notFound();
  const profile = await profileRepository().findByUser(user.id);

  const { fit, job } = app;
  const items = matchedItems(fit);
  const low = fit.score < LOW_FIT_THRESHOLD;
  // Changes whenever the PDF is regenerated, so the preview never shows a stale copy.
  const pdfVersion = app.pdf ? createHash("sha1").update(app.pdf).digest("hex").slice(0, 10) : "";
  const fileName = resumeFileName(app.company, profile?.profile.personal.name ?? user.name, "pdf");

  return (
    <div className="grid gap-12">
      <PageHeader
        title={app.role}
        description={`${app.company}${job.location ? `, ${job.location}` : ""}`}
        action={
          <div className="flex items-baseline gap-1">
            <span className={`font-mono text-5xl font-medium tabular-nums ${low ? "text-danger" : "text-accent"}`}>
              {fit.score}
            </span>
            <span className="font-mono text-sm text-faint">/100 fit</span>
          </div>
        }
      />

      {low ? (
        <Card>
          <h2 className="font-medium">Worth applying? Your call.</h2>
          <p className="text-sm text-muted">This one scores below {LOW_FIT_THRESHOLD}. The biggest gaps:</p>
          <ul className="grid list-disc gap-1 pl-5 text-sm">
            {fit.blockers.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </Card>
      ) : null}

      <section className="grid gap-5">
        <SectionHeader title="Requirements and stack" />
        <div className="grid gap-8 md:grid-cols-3">
          {GROUPS.map(({ match, label, icon: Icon }) => {
            const group = items.filter((i) => i.match === match);
            return (
              <div key={match} className="grid content-start gap-3">
                <h3 className="flex items-center gap-2 text-sm font-medium text-muted">
                  <Icon size={16} weight="bold" className={match === "HAVE" ? "text-accent" : "text-faint"} />
                  {label}
                  <span className="font-mono text-faint">{group.length}</span>
                </h3>
                {group.length === 0 ? (
                  <p className="text-sm text-faint">None</p>
                ) : (
                  <ul className="grid gap-2.5">
                    {group.map((i) => (
                      <li key={i.item} className="grid gap-0.5">
                        <span className="text-[15px]">{i.item}</span>
                        {i.evidence ? <span className="text-sm text-faint">{i.evidence}</span> : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
        {fit.angles.length > 0 ? (
          <div className="grid gap-2 border-t border-line pt-5">
            <h3 className="text-sm font-medium text-muted">Strongest angles</h3>
            <ul className="grid list-disc gap-1 pl-5 text-[15px]">
              {fit.angles.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      {app.status === "questions" ? (
        <section className="grid max-w-3xl gap-5">
          <SectionHeader
            title="A few questions first"
            description="Short answers are fine. Skip any you don’t care about."
          />
          <QuestionsForm id={app.id} questions={app.questions} answers={app.answers ?? {}} />
        </section>
      ) : (
        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <iframe
            title={`Resume for ${app.company}`}
            src={`/applications/${app.id}/pdf?v=${pdfVersion}`}
            className="aspect-[8.5/11] w-full rounded-ui border border-line bg-white"
          />
          <aside className="grid content-start gap-8">
            <div className="grid gap-3">
              <ButtonAnchor href={`/applications/${app.id}/pdf?download=pdf`}>Download PDF</ButtonAnchor>
              <p className="break-all font-mono text-xs text-faint">{fileName}</p>
              <a
                href={`/applications/${app.id}/pdf?download=typ`}
                className="text-sm text-muted underline hover:text-ink"
              >
                Download Typst source
              </a>
            </div>
            {app.resume?.decisions.length ? (
              <div className="grid gap-2">
                <h2 className="text-sm font-medium text-muted">What changed for this role</h2>
                <ul className="grid list-disc gap-1.5 pl-5 text-sm">
                  {app.resume.decisions.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <ReviseForm id={app.id} />
            <details className="group">
              <summary className="cursor-pointer text-sm text-muted hover:text-ink">
                Change answers and regenerate
              </summary>
              <div className="pt-4">
                <QuestionsForm id={app.id} questions={app.questions} answers={app.answers ?? {}} />
              </div>
            </details>
          </aside>
        </section>
      )}
    </div>
  );
}
