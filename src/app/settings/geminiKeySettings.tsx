"use client";

import {
  ArrowSquareOut,
  Broadcast,
  Check,
  CheckCircle,
  FloppyDisk,
  Key,
  Question,
  Shield,
  ShieldCheck,
  Trash,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useState, useTransition } from "react";
import type { ActionState } from "@/app/actions";
import { checkGeminiKey } from "@/components/checkGeminiKey";
import { GEMINI_KEY_GUIDE, setGeminiKey, useGeminiKey, useKeyRemembered } from "@/components/geminiKey";
import { Badge, Button, Card, Field, FormMessage, SecretInput, SectionHeader } from "@/components/ui";

function status(saved: string | null, remembered: boolean | null): string {
  if (saved === null) return "Checking this browser...";
  if (!saved) return "No key in this browser yet.";
  const where = remembered ? "Saved on this device" : "Saved for this tab only";
  return `${where}, ending in ${saved.slice(-4)}.`;
}

const TRUST_FACTS = [
  "Tailor's server never receives it. Your browser sends it directly to Google's Gemini API over HTTPS.",
  "Only the results go to Tailor: the job analysis, resume and cover letter. Never the key.",
  "It's kept only in this browser. Tailor has no database field for it, so there's nothing on our side to leak.",
  "The page is only allowed to connect to Tailor and Google, and if an error ever repeats the key, it's removed before it's shown.",
  "Signing out or pressing Remove deletes it from this browser.",
];

const SAFETY_STEPS = [
  {
    title: "Limit what the key can do",
    body: "In Credentials, edit the key and restrict it to the Generative Language API only. If it ever leaks, it can't be used for anything else.",
    link: "https://console.cloud.google.com/apis/credentials",
    label: "Open Credentials",
  },
  {
    title: "Cap what it can cost",
    body: "A free-tier key can't run up a bill. On a paid key, add a budget alert under Billing so you hear about unusual use.",
    link: "https://console.cloud.google.com/billing",
    label: "Open Billing",
  },
  {
    title: "Replace it if in doubt",
    body: "Delete the key in Google AI Studio and create a new one. The old one stops working immediately.",
    link: "https://aistudio.google.com/apikey",
    label: "Open AI Studio",
  },
];

export function GeminiKeySettings() {
  const saved = useGeminiKey();
  const remembered = useKeyRemembered();
  const [draft, setDraft] = useState("");
  const [rememberChoice, setRememberChoice] = useState<boolean | null>(null);
  const [state, setState] = useState<ActionState>({});
  // Set only when a test in this visit succeeded, so the badge never claims more than it knows.
  const [verified, setVerified] = useState(false);
  const [pending, startTransition] = useTransition();
  const [testing, startTesting] = useTransition();

  // Follows the saved key until the user picks something themselves.
  const remember = rememberChoice ?? remembered ?? true;

  function changeRemember(next: boolean) {
    setRememberChoice(next);
    // With a key already saved, moving it takes effect right away.
    if (saved && !draft.trim()) {
      setGeminiKey(saved, next);
      setState({ notice: next ? "Now remembered on this device." : "Now kept only until this tab closes." });
    }
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    const key = draft.trim();
    if (!key) return;
    startTransition(async () => {
      const result = await checkGeminiKey(key);
      if (!result.error) {
        setGeminiKey(key, remember);
        setDraft("");
      }
      setVerified(!result.error);
      setState(
        result.error
          ? result
          : { notice: remember ? "Key works. Saved on this device." : "Key works. Kept until you close this tab." },
      );
    });
  }

  // Tests what's typed in the box, or the saved key when the box is empty.
  function testConnection() {
    const key = draft.trim() || saved;
    if (!key) return;
    startTesting(async () => {
      const result = await checkGeminiKey(key);
      setVerified(!result.error);
      setState(result.error ? result : { notice: "Connection works." });
    });
  }

  return (
    <>
      <Card>
        <SectionHeader
          icon={<ShieldCheck size={18} />}
          title="Your key never reaches Tailor's server"
          description="Where your key goes, and where it never goes"
        />
        <ul className="grid gap-3 border-t border-line pt-5 text-sm leading-relaxed">
          {TRUST_FACTS.map((fact) => (
            <li key={fact} className="flex items-start gap-2.5">
              <Check size={16} weight="bold" className="mt-0.5 shrink-0 text-good" />
              <span className="text-muted">{fact}</span>
            </li>
          ))}
        </ul>
        <p className="border-t border-line pt-4 text-sm text-faint">
          The details are in the{" "}
          <Link href="/privacy" className="text-accent underline">
            Privacy Policy
          </Link>
          .
        </p>
      </Card>

      <Card>
        <SectionHeader
          icon={<Key size={18} />}
          title="Gemini API key"
          description={status(saved, remembered)}
          aside={
            verified ? (
              <Badge tone="good">
                <CheckCircle size={13} weight="fill" />
                Verified just now
              </Badge>
            ) : null
          }
        />

        <form onSubmit={save} className="grid gap-4 border-t border-line pt-5">
          <Field
            label={
              <span className="flex items-center justify-between gap-3">
                {saved ? "Replace key" : "Your key"}
                {saved || draft.trim() ? (
                  <button
                    type="button"
                    onClick={testConnection}
                    disabled={testing}
                    className="inline-flex items-center gap-1.5 text-xs font-normal text-accent hover:underline disabled:opacity-60"
                  >
                    <Broadcast size={13} />
                    {testing ? "Testing..." : "Test connection"}
                  </button>
                ) : null}
              </span>
            }
            htmlFor="gemini-key"
            hint="Checked with one tiny request from this browser to Google, then kept only here."
          >
            <SecretInput
              id="gemini-key"
              autoComplete="off"
              spellCheck={false}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
          </Field>

          <label className="flex cursor-pointer items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => changeRemember(e.target.checked)}
              className="mt-0.5 size-4 shrink-0 cursor-pointer accent-[var(--accent)]"
            />
            <span className="grid gap-0.5">
              <span className="font-medium">Remember on this device</span>
              <span className="text-faint">
                Turn this off on a shared computer. The key is then forgotten when you close the tab.
              </span>
            </span>
          </label>

          <FormMessage {...state} />
          <div className="flex flex-wrap gap-3 border-t border-line pt-5">
            <Button type="submit" disabled={pending || !draft.trim()}>
              <FloppyDisk size={16} />
              {pending ? "Checking..." : "Save key"}
            </Button>
            {saved ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setGeminiKey("");
                  setVerified(false);
                  setState({ notice: "Removed from this browser." });
                }}
              >
                <Trash size={16} />
                Remove
              </Button>
            ) : null}
          </div>
        </form>
      </Card>
    </>
  );
}

// Optional hardening steps for the key, shown next to the models.
export function KeySafetyCard() {
  return (
    <Card>
      <SectionHeader
        icon={<Shield size={18} />}
        title="Keep your key safe"
        description="Worth doing for any key you paste into any app. Each step takes a minute in Google Cloud."
      />
      <ol className="grid gap-3 border-t border-line pt-5">
        {SAFETY_STEPS.map((step, i) => (
          <li
            key={step.title}
            className="grid gap-3 rounded-ui border border-line bg-sunken p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center"
          >
            <span className="grid size-6 place-items-center rounded-full bg-accent-soft font-mono text-xs text-accent">
              {i + 1}
            </span>
            <span className="grid gap-0.5">
              <span className="text-sm font-medium">{step.title}</span>
              <span className="text-sm leading-relaxed text-muted">{step.body}</span>
            </span>
            <a
              href={step.link}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 whitespace-nowrap text-sm text-accent hover:underline"
            >
              {step.label}
              <ArrowSquareOut size={13} />
            </a>
          </li>
        ))}
      </ol>
      <p className="border-t border-line pt-4 text-sm text-faint">
        <Question size={15} className="mr-2 inline align-[-2px]" />
        New to Gemini keys?{" "}
        <a href={GEMINI_KEY_GUIDE} target="_blank" rel="noreferrer" className="text-accent underline">
          Google’s guide to getting one
        </a>
      </p>
    </Card>
  );
}
