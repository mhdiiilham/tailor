import { createHash } from "node:crypto";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CaretRight, DownloadSimple, Lightning, MagnifyingGlass, Sparkle } from "@phosphor-icons/react/dist/ssr";
import { applicationRecords, applicationRepository, profileRepository } from "@/container";
import type { Application } from "@/domain/application";
import { LOW_FIT_THRESHOLD, matchCounts, type FitAnalysis } from "@/domain/fit";
import type { Profile } from "@/domain/profile";
import { resumeFileName } from "@/domain/slug";
import { Badge, ButtonAnchor, Card, SectionHeader } from "@/components/ui";
import { requireUser } from "@/infrastructure/auth/session";
import { StageSelect } from "@/components/stageSelect";
import { ScrollToResult } from "@/components/scrollToResult";
import { AnalyzeTrackedForm } from "./analyzeTracked";
import { CoverLetterPanel } from "./coverLetter";
import { NotesCard } from "./details";
import { DeleteApplication } from "./deleteApplication";
import { ResumeViewer } from "./resumeViewer";
import { QuestionsForm, ReviseForm } from "./forms";
import { MissingKeywords } from "./missingKeywords";
import { RequirementsList } from "./requirementsList";
import { ScoreCard } from "./scoreCard";

export const dynamic = "force-dynamic";

const dateFormat = new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" });

// Requirements and stack items, without repeats (a posting often lists "Go" in both).
function matchedItems(fit: FitAnalysis) {
  const seen = new Set<string>();
  return [...fit.requirements, ...fit.techStack].filter((i) => {
    const key = i.item.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function matchLabel(score: number) {
  if (score >= 75) return { text: "Strong match", tone: "good" as const };
  if (score >= LOW_FIT_THRESHOLD) return { text: "Good match", tone: "accent" as const };
  return { text: "Low match", tone: "danger" as const };
}

const sectionLinks = (withCoverLetter: boolean) => [
  { href: "#match", label: "Match" },
  { href: "#resume", label: "Resume" },
  ...(withCoverLetter ? [{ href: "#cover-letter", label: "Cover letter" }] : []),
  { href: "#job", label: "Job description" },
];

function NeedsProfile() {
  return (
    <p className="text-sm text-muted">
      Your profile is missing.{" "}
      <Link href="/profile" className="text-accent underline">
        Add it again
      </Link>{" "}
      to write or revise resumes.
    </p>
  );
}

function Breadcrumb({ role }: { role: string }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-faint">
      <Link href="/" className="hover:text-ink">
        Applications
      </Link>
      <CaretRight size={12} />
      <span className="truncate text-muted">{role}</span>
    </nav>
  );
}

// A job added only to track it: its details, notes, and a way to analyze it later.
function TrackedApplication({ app, profile }: { app: Application; profile: Profile | null }) {
  return (
    <div className="grid grid-cols-1 gap-8">
      <Breadcrumb role={app.role} />
      <header className="grid min-w-0 grid-cols-1 gap-4">
        <div className="flex flex-wrap gap-2">
          <Badge>Tracked</Badge>
          {app.job.location ? (
            <Badge tone="accent" truncate>
              {app.job.location}
            </Badge>
          ) : null}
        </div>
        <h1 className="text-3xl font-semibold leading-tight tracking-tight md:text-4xl">{app.role}</h1>
        <p className="text-muted">{app.company}</p>
        <div className="flex flex-wrap items-center gap-3 text-sm text-faint">
          <StageSelect id={app.id} stage={app.stage} />
          {app.appliedAt ? <span>Applied {dateFormat.format(app.appliedAt)}</span> : null}
        </div>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <NotesCard id={app.id} notes={app.notes} />
        <Card>
          <SectionHeader
            icon={<MagnifyingGlass size={18} />}
            title="Analyze and tailor"
            description={
              app.jdText
                ? "Your saved job description is below. Analyze it to score your fit and write a tailored resume; this job keeps its stage, dates and notes."
                : "Paste the job description to score your fit and write a tailored resume. This job keeps its stage, dates and notes."
            }
          />
          {profile ? <AnalyzeTrackedForm id={app.id} profile={profile} initialText={app.jdText} /> : <NeedsProfile />}
        </Card>
      </div>

      {app.jdText ? (
        <Card>
          <details>
            <summary className="cursor-pointer font-medium">Job description you saved</summary>
            <p className="mt-4 max-h-[480px] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-muted">
              {app.jdText}
            </p>
          </details>
        </Card>
      ) : null}

      <section className="border-t border-line pt-8">
        <DeleteApplication id={app.id} />
      </section>
    </div>
  );
}

export default async function ApplicationPage({ params }: PageProps<"/applications/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  const app = await applicationRepository().findById(user.id, Number(id));
  if (!app) notFound();
  const profile = await profileRepository().findByUser(user.id);

  const { fit, job } = app;
  if (!fit) return <TrackedApplication app={app} profile={profile?.profile ?? null} />;
  const items = matchedItems(fit);
  const label = matchLabel(fit.score);
  const generated = app.status === "generated";
  // Changes whenever the PDF is regenerated, so the preview never shows a stale copy.
  const preview = generated ? await applicationRecords().previewFor(user.id, app.id) : null;
  // The AI steps run in the browser, so they get the user's own profile and this application's data.
  const userProfile = profile?.profile;
  const context = {
    jdText: app.jdText,
    job: app.job,
    fit,
    questions: app.questions,
    answers: app.answers,
    resume: app.resume,
  };
  const fileName = resumeFileName(app.company, profile?.profile.personal.name ?? user.name, "pdf");

  return (
    <div className="grid grid-cols-1 gap-8">
      <Breadcrumb role={app.role} />

      <header className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-center">
        <div className="grid min-w-0 grid-cols-1 gap-4">
          <div className="flex flex-wrap gap-2">
            {job.location ? (
              <Badge tone="accent" truncate>
                {job.location}
              </Badge>
            ) : null}
            {job.yearsRequired ? <Badge mono>{job.yearsRequired}+ yrs asked</Badge> : null}
            {job.techStack.slice(0, 3).map((t) => (
              <Badge key={t} mono>
                {t}
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold leading-tight tracking-tight md:text-4xl">{app.role}</h1>
            <Badge tone={label.tone}>{label.text}</Badge>
          </div>
          <p className="text-muted">{app.company}</p>
          <div className="flex flex-wrap items-center gap-3 text-sm text-faint">
            <StageSelect id={app.id} stage={app.stage} />
            {app.appliedAt ? <span>Applied {dateFormat.format(app.appliedAt)}</span> : null}
            {app.stageUpdatedAt && app.stage !== "applied" && app.stage !== "not_applied" ? (
              <span>Updated {dateFormat.format(app.stageUpdatedAt)}</span>
            ) : null}
          </div>
          {generated ? (
            <div className="flex flex-wrap items-center gap-3">
              <ButtonAnchor href={`/applications/${app.id}/pdf?download=pdf`}>
                <DownloadSimple size={16} weight="bold" />
                Download PDF
              </ButtonAnchor>
              <ButtonAnchor variant="secondary" href={`/applications/${app.id}/pdf?download=typ`}>
                Typst source
              </ButtonAnchor>
            </div>
          ) : null}
        </div>
        <ScoreCard score={fit.score} counts={matchCounts(fit)} />
      </header>

      <nav className="flex gap-1 overflow-x-auto border-b border-line text-sm" aria-label="Sections">
        {sectionLinks(generated).map((s) => (
          <a
            key={s.href}
            href={s.href}
            className="-mb-px whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-muted hover:border-line hover:text-ink"
          >
            {s.label}
          </a>
        ))}
      </nav>

      <div
        className={`grid grid-cols-1 items-start gap-6 ${
          // Once there's a resume it gets the wide column; before that, the questions sit beside the match.
          generated ? "lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]" : "lg:grid-cols-[minmax(0,1fr)_440px]"
        }`}
      >
        <div id="match" className="grid scroll-mt-24 gap-6">
          {fit.score < LOW_FIT_THRESHOLD && fit.blockers.length > 0 ? (
            <Card className="border-danger/30">
              <SectionHeader
                title="Worth applying? Your call."
                description={`This one scores below ${LOW_FIT_THRESHOLD}. The biggest gaps:`}
              />
              <ul className="grid list-disc gap-1 pl-5 text-sm">
                {fit.blockers.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </Card>
          ) : null}

          {fit.angles.length > 0 ? (
            <Card>
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-ui bg-accent-soft text-accent">
                  <Sparkle size={18} weight="fill" />
                </span>
                <SectionHeader title="Strongest angles" description="What this resume leads with" />
              </div>
              <ul className="grid gap-3">
                {fit.angles.map((a) => (
                  <li key={a.title + a.detail} className="grid gap-2 rounded-ui border border-line bg-sunken p-4">
                    {a.title ? <p className="font-medium">{a.title}</p> : null}
                    <p className="text-sm leading-relaxed text-muted">{a.detail}</p>
                    {a.source || a.jdQuote ? (
                      <div className="flex flex-wrap items-center gap-2 text-xs text-faint">
                        {a.source ? <Badge>{a.source}</Badge> : null}
                        {a.jdQuote ? <span>Answers “{a.jdQuote}”</span> : null}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {fit.missingKeywords && fit.missingKeywords.length > 0 ? (
            <Card>
              <SectionHeader
                title="Keywords to cover"
                description="What a recruiter or ATS looks for that your resume lacks or only weakly shows."
              />
              <MissingKeywords items={fit.missingKeywords} />
            </Card>
          ) : null}

          <Card>
            <SectionHeader
              title="Requirements and stack"
              description="Each requirement from the posting, matched against your profile."
            />
            <RequirementsList items={items} />
          </Card>
        </div>

        <div id="resume" className="grid scroll-mt-24 gap-6">
          {generated ? (
            <>
              <Card id="resume-viewer" className="scroll-mt-24">
                <SectionHeader title="Tailored resume" />
                {preview ? (
                  <>
                    <ResumeViewer id={app.id} pages={preview.pages.length} version={preview.version} />
                    <ScrollToResult key={preview.version} applicationId={app.id} targetId="resume-viewer" />
                  </>
                ) : null}
                <p className="font-mono text-xs text-faint">{fileName}</p>
                <p className="text-xs text-faint">
                  The stored PDF is deleted from the server 24 hours after it’s made. Downloading later rebuilds it.
                </p>
              </Card>

              <section id="cover-letter" className="scroll-mt-24">
                {userProfile ? (
                  <CoverLetterPanel id={app.id} text={app.coverLetter} profile={userProfile} app={context} />
                ) : (
                  <NeedsProfile />
                )}
                <ScrollToResult
                  key={app.coverLetter ? createHash("sha1").update(app.coverLetter).digest("hex") : "none"}
                  applicationId={app.id}
                  targetId="cover-letter"
                />
              </section>

              {app.resume?.decisions.length ? (
                <Card className="border-accent/30">
                  <h2 className="flex items-center gap-2 font-medium text-accent">
                    <Lightning size={17} weight="fill" />
                    What changed for this role
                  </h2>
                  <ul className="grid list-disc gap-2 pl-5 text-sm leading-relaxed text-muted">
                    {app.resume.decisions.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                </Card>
              ) : null}

              <Card>
                {userProfile ? <ReviseForm id={app.id} profile={userProfile} app={context} /> : <NeedsProfile />}
                <details className="border-t border-line pt-4">
                  <summary className="cursor-pointer text-sm text-muted hover:text-ink">
                    Change your answers and regenerate
                  </summary>
                  <div className="pt-4">
                    {userProfile ? <QuestionsForm id={app.id} profile={userProfile} app={context} /> : <NeedsProfile />}
                  </div>
                </details>
              </Card>
            </>
          ) : (
            <Card>
              <SectionHeader
                title="A few questions first"
                description="Short answers are fine. Skip any you don’t care about."
              />
              {userProfile ? <QuestionsForm id={app.id} profile={userProfile} app={context} /> : <NeedsProfile />}
            </Card>
          )}
        </div>
      </div>

      <NotesCard id={app.id} notes={app.notes} />

      <section id="job" className="scroll-mt-24">
        <Card>
          <details>
            <summary className="cursor-pointer font-medium">Job description you pasted</summary>
            <p className="mt-4 max-h-[480px] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-muted">
              {app.jdText}
            </p>
          </details>
        </Card>
      </section>

      <section className="border-t border-line pt-8">
        <DeleteApplication id={app.id} />
      </section>
    </div>
  );
}
