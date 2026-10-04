import Link from "next/link";
import {
  ArrowSquareOut,
  CheckCircle,
  CircleHalf,
  Clock,
  Key,
  LockSimple,
  ShieldCheck,
  Trash,
  XCircle,
} from "@phosphor-icons/react/dist/ssr";
import { GoogleButton } from "@/components/googleButton";

const principles = [
  {
    tag: "Key stays local",
    title: "Your key stays in your browser",
    body: "It’s sent along with each request, used once, then dropped. The server never saves or logs it.",
    note: "Kept in your browser, never on the server",
    icon: Key,
  },
  {
    tag: "No platform fee",
    title: "You pay Google, not us",
    body: "Gemini’s free tier covers it. On a paid key, a resume costs a few cents, billed to you by Google.",
    note: "Your own Gemini quota",
    icon: CheckCircle,
  },
  {
    tag: "Profile only",
    title: "Nothing invented",
    body: "Every line comes from the profile you upload. Titles, companies and dates are copied from it, never generated.",
    note: "Roles are picked from your profile by reference",
    icon: ShieldCheck,
  },
];

const requirements = [
  { title: "Payments backend", body: "Go services for card issuing and settlement." },
  { title: "Databases", body: "PostgreSQL or MySQL at production scale." },
  { title: "Streaming", body: "Kafka or a similar event platform." },
];

const matches = [
  {
    status: "Matched",
    icon: CheckCircle,
    tone: "text-good",
    text: "Cut settlement reconciliation from 3 hours to 12 minutes by batching ledger queries.",
    source: "Profile: Kopi Ledger",
  },
  {
    status: "Partial",
    icon: CircleHalf,
    tone: "text-warn",
    text: "Deep PostgreSQL work; no MySQL listed. You’re asked how to frame it.",
    source: "Profile: skills",
  },
  {
    status: "Missing",
    icon: XCircle,
    tone: "text-danger",
    text: "No Kafka in the profile, so it stays off the resume.",
    source: "Nothing added",
  },
];

const security = [
  {
    icon: Key,
    title: "Key never stored",
    body: "Your Gemini key lives only in your browser, travels with each request over HTTPS, and is scrubbed from any error the server logs. On a shared computer, keep it for the tab only.",
  },
  {
    icon: LockSimple,
    title: "Strict content policy",
    body: "A per-request Content Security Policy only lets the app’s own scripts run next to your key.",
  },
  {
    icon: Clock,
    title: "PDFs gone in 24 hours",
    body: "Stored PDFs are deleted a day after they’re made. Older resumes are rebuilt on demand, not kept.",
  },
  {
    icon: Trash,
    title: "Delete everything",
    body: "Remove one application or your whole account, profile and all, from Settings at any time.",
  },
];

export function Landing({ error }: { error?: string }) {
  return (
    <div className="grid gap-24 md:gap-32">
      <section id="signin" className="grid scroll-mt-24 justify-items-center gap-8 pt-6 text-center md:pt-14">
        <p className="font-mono text-xs uppercase tracking-wider text-faint">Bring your own key · Free to use</p>
        <h1 className="max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight md:text-6xl">
          Tailored resumes, on your own Gemini key.
        </h1>
        <p className="max-w-[46ch] text-lg leading-relaxed text-muted">
          Paste a job description, answer a few questions, download a one-page PDF.
        </p>

        <div className="grid w-full max-w-md gap-4 rounded-card border border-line bg-raised p-6 text-left">
          <GoogleButton fullWidth />
          <a
            href="/sample-resume.pdf"
            target="_blank"
            className="inline-flex items-center justify-center gap-2 rounded-ui border border-line px-4 py-2.5 text-sm text-muted transition-colors hover:border-faint hover:text-ink"
          >
            See a sample resume (PDF)
            <ArrowSquareOut size={14} />
          </a>
          {error ? (
            <p role="alert" className="text-sm text-danger">
              That Google account can’t sign in here.
            </p>
          ) : (
            <p className="flex items-start gap-2 text-xs text-faint">
              <LockSimple size={14} className="mt-px shrink-0" />
              For people 18 and over. You’ll add your own Gemini API key after signing in.
            </p>
          )}
        </div>
      </section>

      <section className="grid gap-10">
        <div className="grid gap-3">
          <h2 className="text-3xl font-semibold tracking-tight">Bring your own key</h2>
          <p className="max-w-[60ch] text-muted">
            Tailor writes with your Gemini key and your profile. It doesn’t sit between you and Google, and it doesn’t
            charge for it.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {principles.map((p) => {
            const Icon = p.icon;
            return (
              <article
                key={p.title}
                className="grid content-between gap-6 rounded-card border border-line bg-raised p-6"
              >
                <div className="grid gap-3">
                  <span className="justify-self-start rounded-chip border border-line bg-sunken px-2 py-0.5 font-mono text-[11px] text-faint">
                    {p.tag}
                  </span>
                  <h3 className="text-lg font-medium">{p.title}</h3>
                  <p className="leading-relaxed text-muted">{p.body}</p>
                </div>
                <p className="flex items-center gap-2 font-mono text-xs text-faint">
                  <Icon size={14} />
                  {p.note}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section id="how" className="grid scroll-mt-24 gap-10">
        <div className="grid gap-3">
          <h2 className="text-3xl font-semibold tracking-tight">How a resume gets made</h2>
          <p className="max-w-[60ch] text-muted">
            Each requirement in the posting is matched against your profile. Only what your profile backs up reaches the
            resume.
          </p>
        </div>

        <div className="overflow-hidden rounded-card border border-line bg-raised">
          <div className="flex items-center justify-between gap-3 border-b border-line bg-sunken px-5 py-3 font-mono text-xs text-faint">
            <span>Example with a fictional profile</span>
            <span>Ratna Wibowo · Backend Engineer</span>
          </div>
          <div className="grid divide-y divide-line lg:grid-cols-3 lg:divide-x lg:divide-y-0">
            <div className="grid content-start gap-3 p-5">
              <p className="font-mono text-[11px] uppercase tracking-wider text-faint">1. From the job description</p>
              {requirements.map((r) => (
                <div key={r.title} className="grid gap-1 rounded-ui border border-line bg-sunken p-3">
                  <p className="text-sm font-medium">{r.title}</p>
                  <p className="text-sm text-muted">{r.body}</p>
                </div>
              ))}
            </div>

            <div className="grid content-start gap-3 p-5">
              <p className="font-mono text-[11px] uppercase tracking-wider text-faint">2. Matched to your profile</p>
              {matches.map((m) => {
                const Icon = m.icon;
                return (
                  <div key={m.status} className="grid gap-1.5 rounded-ui border border-line bg-sunken p-3">
                    <p className={`flex items-center gap-1.5 font-mono text-xs ${m.tone}`}>
                      <Icon size={14} weight="fill" />
                      {m.status}
                    </p>
                    <p className="text-sm">{m.text}</p>
                    <p className="font-mono text-[11px] text-faint">{m.source}</p>
                  </div>
                );
              })}
            </div>

            <div className="grid content-start gap-3 p-5">
              <p className="font-mono text-[11px] uppercase tracking-wider text-faint">3. One-page resume</p>
              <div className="grid gap-3 rounded-ui border border-line bg-white p-4 font-serif text-[12px] leading-snug text-zinc-800">
                <div>
                  <p className="text-base font-semibold text-[#26428b]">Ratna Wibowo</p>
                  <p className="text-[11px] text-zinc-500">Bandung, Indonesia · ratna@example.com</p>
                </div>
                <div className="grid gap-1">
                  <p className="border-b border-zinc-300 text-[11px] font-semibold uppercase tracking-wide text-[#26428b]">
                    Work Experience
                  </p>
                  <p className="font-semibold">Backend Engineer, Kopi Ledger</p>
                  <p>• Cut settlement reconciliation from 3 hours to 12 minutes by batching ledger queries.</p>
                  <p className="font-semibold">Software Engineer, Pasar Cepat</p>
                  <p>• Built the order webhook pipeline that handled 40k events a day.</p>
                </div>
              </div>
              <a
                href="/sample-resume.pdf"
                target="_blank"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-accent"
              >
                Open the full sample PDF
                <ArrowSquareOut size={14} />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="security" className="grid scroll-mt-24 gap-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-3xl font-semibold tracking-tight">Privacy and security</h2>
          <Link href="/privacy" className="text-sm font-medium text-accent">
            Read the Privacy Policy
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {security.map((s) => {
            const Icon = s.icon;
            return (
              <article key={s.title} className="grid content-start gap-3 rounded-card border border-line bg-raised p-6">
                <span className="grid size-9 place-items-center rounded-ui bg-accent-soft text-accent">
                  <Icon size={18} />
                </span>
                <h3 className="font-medium">{s.title}</h3>
                <p className="text-sm leading-relaxed text-muted">{s.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="grid justify-items-center gap-4 rounded-card border border-line bg-raised px-6 py-14 text-center">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Your next application, tailored</h2>
        <p className="max-w-[48ch] text-muted">
          Sign in with Google, add your Gemini key in Settings, and paste the first job description.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href="#signin"
            className="inline-flex h-10 items-center rounded-ui bg-accent px-4 text-sm font-medium text-on-accent hover:opacity-90"
          >
            Sign in
          </a>
          <a
            href="https://ai.google.dev/gemini-api/docs/api-key"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center gap-1.5 rounded-ui border border-line px-4 text-sm text-muted hover:text-ink"
          >
            How to get a Gemini key
            <ArrowSquareOut size={14} />
          </a>
        </div>
      </section>
    </div>
  );
}
