import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL, LegalPage, LegalSection } from "@/components/legal/legalPage";

export const metadata: Metadata = { title: "Terms and Conditions · Tailor" };

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms and Conditions"
      intro={
        <p>
          These terms are the agreement between you and Muhammad Ilham, who runs Tailor. By signing in you agree to them
          and to the <Link href="/privacy">Privacy Policy</Link>. If you don’t agree, please don’t use Tailor.
        </p>
      }
    >
      <LegalSection title="Who can use Tailor">
        <ul>
          <li>You must be at least 18 years old.</li>
          <li>You need a Google account to sign in. The operator may limit sign-in to certain email addresses.</li>
          <li>Use it for your own job applications, with your own information.</li>
        </ul>
      </LegalSection>

      <LegalSection title="What Tailor does">
        <p>
          Tailor compares a job description with the profile you provide, asks you a few questions, and uses Google’s
          Gemini AI to write a tailored resume. It is free to use. Features may change, and Tailor may be paused or shut
          down at any time.
        </p>
      </LegalSection>

      <LegalSection title="Your Gemini key and its costs">
        <p>
          Tailor runs on your own Gemini API key. Anything Google charges for that key, and Google’s{" "}
          <a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noreferrer">
            Gemini API terms
          </a>
          , are between you and Google. Keep your key private and remove it from any shared computer.
        </p>
      </LegalSection>

      <LegalSection title="Check every resume before you send it">
        <p>
          Tailor only builds resumes from your profile, but AI can still get things wrong: a detail phrased in a way you
          wouldn’t, an emphasis you disagree with, or a mistake. You are responsible for reading each resume and making
          sure everything in it is true before you send it to anyone. The fit score is an estimate, not a prediction
          that you’ll get the job.
        </p>
      </LegalSection>

      <LegalSection title="Your content">
        <p>
          Your profile, job descriptions, answers and resumes stay yours. You give Tailor permission to store and
          process them only to run the service for you, including sending them to Google’s Gemini API. Only add
          information you have the right to use, and don’t add other people’s personal data without their permission.
        </p>
      </LegalSection>

      <LegalSection title="Acceptable use">
        <p>Don’t use Tailor to:</p>
        <ul>
          <li>create false or misleading claims about your experience or qualifications;</li>
          <li>impersonate someone else or use their information without permission;</li>
          <li>break the law, or try to break, overload or get around Tailor’s security;</li>
          <li>access anyone else’s account or data.</li>
        </ul>
        <p>Access can be suspended or removed if these terms are broken.</p>
      </LegalSection>

      <LegalSection title="Ending your use">
        <p>
          You can stop using Tailor at any time and delete your account and everything in it from{" "}
          <Link href="/settings">Settings</Link>.
        </p>
      </LegalSection>

      <LegalSection title="No warranty">
        <p>
          Tailor is provided “as is” and “as available”, free of charge, without promises that it will be error-free,
          always available, or that it will get you an interview or a job.
        </p>
      </LegalSection>

      <LegalSection title="Limitation of liability">
        <p>
          As far as the law allows, Muhammad Ilham is not liable for indirect or consequential losses from using Tailor,
          including lost job opportunities, Google charges on your key, or decisions made by employers. Nothing in these
          terms limits liability that cannot be limited by law.
        </p>
      </LegalSection>

      <LegalSection title="Changes to these terms">
        <p>
          If these terms change, the date at the top changes too, and significant changes will be announced in the app.
          Continuing to use Tailor after that means you accept the new terms.
        </p>
      </LegalSection>

      <LegalSection title="Governing law">
        <p>These terms are governed by the laws of the Republic of Indonesia.</p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Questions about these terms: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
