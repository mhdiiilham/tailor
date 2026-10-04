import { GoogleButton } from "@/components/googleButton";

const points = [
  {
    title: "Your key stays in your browser",
    body: "It’s sent along with each request, used once, then dropped. Nothing about it is saved on the server.",
  },
  {
    title: "You pay Google, not us",
    body: "Gemini’s free tier covers it. On a paid key, a resume costs a few cents.",
  },
  {
    title: "Nothing invented",
    body: "Every line comes from the profile you upload. Titles, companies and dates are copied, never generated.",
  },
];

export function Landing({ error }: { error?: string }) {
  return (
    <div className="grid gap-20 md:gap-28">
      <section className="grid max-w-2xl gap-6 pt-4 md:pt-12">
        <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight md:text-6xl">
          Tailored resumes, on your own Gemini key.
        </h1>
        <p className="max-w-[48ch] text-lg leading-relaxed text-muted">
          Paste a job description, answer a few questions, download a one-page PDF. Bring your own key.
        </p>
        <div className="grid gap-3">
          <GoogleButton />
          {error ? (
            <p role="alert" className="text-sm text-danger">
              That Google account isn’t on the invite list. Ask the owner to add your email.
            </p>
          ) : null}
        </div>
      </section>

      <section className="grid gap-8">
        <h2 className="text-2xl font-semibold tracking-tight">Bring your own key</h2>
        <dl className="grid gap-y-8 border-t border-line pt-8 md:grid-cols-[260px_1fr] md:gap-x-12">
          {points.map((p) => (
            <div key={p.title} className="contents">
              <dt className="font-medium">{p.title}</dt>
              <dd className="-mt-6 max-w-[60ch] text-muted md:mt-0">{p.body}</dd>
            </div>
          ))}
        </dl>
        <p className="text-sm text-faint">Invite only for now. Sign-in works for emails on the list.</p>
      </section>
    </div>
  );
}
