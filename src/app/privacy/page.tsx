import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL, LegalPage, LegalSection } from "@/components/legal/legalPage";

export const metadata: Metadata = { title: "Privacy Policy · Tailor" };

const cookies = [
  {
    name: "better-auth.state",
    purpose: "Protects the Google sign-in step against forged requests.",
    lasts: "5 minutes, only while signing in",
  },
  {
    name: "better-auth.session_token",
    purpose: "Keeps you signed in.",
    lasts: "7 days after you last use Tailor, or until you sign out",
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro={
        <p>
          Tailor turns a job description and your own profile into a tailored resume. This page explains what it stores,
          what it sends elsewhere, and how to delete it. It’s written to match how the app actually works.
        </p>
      }
    >
      <LegalSection title="Who runs Tailor">
        <p>
          Tailor is run by Muhammad Ilham, an individual based in Indonesia, who decides how your data is used (the data
          controller). Contact: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </LegalSection>

      <LegalSection title="What Tailor stores">
        <ul>
          <li>
            <strong>Your Google account basics:</strong> name, email address, profile picture link and Google account
            ID, plus the sign-in tokens Google returns. Used only to sign you in.
          </li>
          <li>
            <strong>Session details:</strong> a session ID, its expiry, and the IP address and browser information of
            the device that signed in.
          </li>
          <li>
            <strong>What you enter:</strong> your profile (work history, skills, projects, contact details you include),
            the job descriptions you paste, your answers to the questions, and revision requests.
          </li>
          <li>
            <strong>What Tailor creates for you:</strong> the fit analysis, the tailored resume content, its Typst
            source, the PDF, and the stage and dates you set for each application.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="What Tailor does not store">
        <ul>
          <li>
            <strong>Your Gemini API key.</strong> It stays in your browser’s local storage. Each AI request sends it to
            Tailor’s server, which uses it for that one request and never saves or logs it.
          </li>
          <li>No analytics, no advertising, no tracking pixels, no data sold or shared for marketing.</li>
          <li>Tailor does not use your data to train AI models.</li>
        </ul>
      </LegalSection>

      <LegalSection title="How your data is used">
        <p>
          Only to provide Tailor: signing you in, analyzing a job description against your profile, writing and revising
          your resume, producing the PDF, and showing your applications and their progress.
        </p>
      </LegalSection>

      <LegalSection title="Who else handles it">
        <ul>
          <li>
            <strong>Google (sign-in).</strong> When you sign in with Google, Google’s{" "}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">
              Privacy Policy
            </a>{" "}
            applies to that step.
          </li>
          <li>
            <strong>Google (Gemini API).</strong> To write your resume, Tailor sends your profile, the job description
            and your answers to Google’s Gemini API using your own key. Google processes this under its{" "}
            <a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noreferrer">
              Gemini API terms
            </a>
            . On Google’s free tier, Google may use that content to improve its products; a paid key turns that off.
            Google may process it outside Indonesia.
          </li>
          <li>
            <strong>Tencent Cloud (Jakarta, Indonesia)</strong> hosts the server and database where your data is stored.
          </li>
        </ul>
        <p>Nothing else is shared, unless the law requires it.</p>
      </LegalSection>

      <LegalSection title="Cookies and local storage">
        <p>
          Tailor uses only the cookies needed to sign you in. There are no analytics, advertising or tracking cookies,
          so there is no cookie banner.
        </p>
        <div className="overflow-x-auto rounded-ui border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-sunken font-mono text-[11px] uppercase tracking-wider text-faint">
              <tr>
                <th className="px-4 py-2.5 font-normal">Cookie</th>
                <th className="px-4 py-2.5 font-normal">Why</th>
                <th className="px-4 py-2.5 font-normal">How long</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {cookies.map((c) => (
                <tr key={c.name}>
                  <td className="px-4 py-3 font-mono text-xs text-ink">{c.name}</td>
                  <td className="px-4 py-3">{c.purpose}</td>
                  <td className="px-4 py-3">{c.lasts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Both are HttpOnly, so scripts on the page can’t read them. On the live site their names start with{" "}
          <code className="font-mono text-xs">__Secure-</code>. Separately, your browser’s local storage holds your
          Gemini key. Signing out removes it.
        </p>
      </LegalSection>

      <LegalSection title="How long it is kept">
        <ul>
          <li>
            <strong>PDFs</strong> are deleted from the server 24 hours after they’re made. You can still download an
            older resume: Tailor rebuilds it from the saved Typst source without storing it again.
          </li>
          <li>
            <strong>Everything else</strong> stays until you delete it. Delete a single application from its page, or
            your whole account from <Link href="/settings">Settings</Link>, which removes your sign-in, profile and all
            applications. Deletion is permanent.
          </li>
          <li>If server backups exist, deleted data may remain in them until those backups are replaced.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Your rights">
        <p>
          Under Indonesia’s Personal Data Protection Law (UU PDP) and similar laws, you can ask to see the data Tailor
          holds about you, correct it, get a copy, withdraw consent, or have it deleted. Most of this you can do
          yourself: edit your profile, download your resumes, delete applications or your account. For anything else,
          email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and you’ll get an answer within the time the law
          requires.
        </p>
      </LegalSection>

      <LegalSection title="Age">
        <p>
          Tailor is for people aged 18 and over. It is not meant for children and does not knowingly collect data from
          anyone under 18. If you believe someone under 18 has an account, email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and their data will be deleted.
        </p>
      </LegalSection>

      <LegalSection title="Security">
        <p>
          Connections use HTTPS, sign-in is limited to invited accounts, every request checks that you only reach your
          own data, and AI keys are never stored on the server. No system is perfectly secure; if a breach affects your
          data, you’ll be told as the law requires.
        </p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>
          If this policy changes, the date at the top changes too. Significant changes will be announced in the app
          before they take effect.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
