"use client";

import { ArrowSquareOut, Check } from "@phosphor-icons/react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { testGeminiKey, type ActionState } from "@/app/actions";
import { GEMINI_KEY_GUIDE, setGeminiKey, useGeminiKey, useKeyRemembered } from "@/components/geminiKey";
import { Button, Card, Field, FormMessage, SectionHeader, TextInput } from "@/components/ui";

function status(saved: string | null, remembered: boolean | null): string {
  if (saved === null) return "Checking this browser...";
  if (!saved) return "No key in this browser yet.";
  const where = remembered ? "Saved on this device" : "Saved for this tab only";
  return `${where}, ending in ${saved.slice(-4)}.`;
}

export function GeminiKeySettings() {
  const saved = useGeminiKey();
  const remembered = useKeyRemembered();
  const [draft, setDraft] = useState("");
  const [rememberChoice, setRememberChoice] = useState<boolean | null>(null);
  const [state, setState] = useState<ActionState>({});
  const [pending, startTransition] = useTransition();

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
      const result = await testGeminiKey(key);
      if (!result.error) {
        setGeminiKey(key, remember);
        setDraft("");
      }
      setState(
        result.error
          ? result
          : { notice: remember ? "Key works. Saved on this device." : "Key works. Kept until you close this tab." },
      );
    });
  }

  return (
    <>
      <Card>
        <SectionHeader title="Gemini API key" description={status(saved, remembered)} />

        <form onSubmit={save} className="grid gap-4">
          <Field
            label={saved ? "Replace key" : "Your key"}
            htmlFor="gemini-key"
            hint="Checked with one tiny request to Google, then kept only in this browser."
          >
            <TextInput
              id="gemini-key"
              type="password"
              autoComplete="off"
              spellCheck={false}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              mono
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
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={pending || !draft.trim()}>
              {pending ? "Checking..." : "Save key"}
            </Button>
            {saved ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setGeminiKey("");
                  setState({ notice: "Removed from this browser." });
                }}
              >
                Remove
              </Button>
            ) : null}
          </div>
        </form>
      </Card>

      <Card>
        <SectionHeader title="What Tailor does with your key" />
        <ul className="grid gap-2.5 text-sm leading-relaxed">
          {[
            "It stays in this browser. Tailor has no database field for it and never saves it on the server.",
            "Each AI request sends it to the server over HTTPS, where it's used for that one call to Google and then dropped.",
            "It's never written to logs. If an error mentions it, the key is removed before anything is logged or shown.",
            "Signing out or pressing Remove deletes it from this browser.",
          ].map((fact) => (
            <li key={fact} className="flex items-start gap-2.5">
              <Check size={16} weight="bold" className="mt-0.5 shrink-0 text-good" />
              <span className="text-muted">{fact}</span>
            </li>
          ))}
        </ul>
        <p className="text-sm text-faint">
          The details are in the{" "}
          <Link href="/privacy" className="text-accent underline">
            Privacy Policy
          </Link>
          .
        </p>
      </Card>

      <Card>
        <SectionHeader
          title="Keep your key safe"
          description="Worth doing for any key you paste into any app. Each step takes a minute in Google Cloud."
        />
        <ol className="grid gap-4 text-sm leading-relaxed">
          {[
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
          ].map((step, i) => (
            <li key={step.title} className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
              <span className="grid size-6 place-items-center rounded-full bg-accent-soft font-mono text-xs text-accent">
                {i + 1}
              </span>
              <span className="font-medium">{step.title}</span>
              <span />
              <span className="text-muted">
                {step.body}{" "}
                <a
                  href={step.link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-accent underline"
                >
                  {step.label}
                  <ArrowSquareOut size={12} />
                </a>
              </span>
            </li>
          ))}
        </ol>
        <p className="text-sm text-faint">
          New to Gemini keys?{" "}
          <a href={GEMINI_KEY_GUIDE} target="_blank" rel="noreferrer" className="text-accent underline">
            Google’s guide to getting one
          </a>
          .
        </p>
      </Card>
    </>
  );
}
