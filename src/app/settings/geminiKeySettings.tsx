"use client";

import { useState, useTransition } from "react";
import { testGeminiKey, type ActionState } from "@/app/actions";
import { GEMINI_KEY_GUIDE, setGeminiKey, useGeminiKey } from "@/components/geminiKey";
import { Button, Field, FormMessage, SectionHeader, TextInput } from "@/components/ui";

export function GeminiKeySettings() {
  const saved = useGeminiKey();
  const [draft, setDraft] = useState("");
  const [state, setState] = useState<ActionState>({});
  const [pending, startTransition] = useTransition();

  function save(e: React.FormEvent) {
    e.preventDefault();
    const key = draft.trim();
    if (!key) return;
    startTransition(async () => {
      const result = await testGeminiKey(key);
      if (!result.error) {
        setGeminiKey(key);
        setDraft("");
      }
      setState(result.error ? result : { notice: "Saved in this browser." });
    });
  }

  return (
    <section className="grid gap-6">
      <SectionHeader
        title="Gemini API key"
        description={
          saved === null
            ? "Checking this browser..."
            : saved
              ? `Saved in this browser, ending in ${saved.slice(-4)}.`
              : "No key in this browser yet."
        }
      />

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

      <div className="grid gap-2 border-t border-line pt-5 text-sm text-muted">
        <p>
          The key never gets stored on the server. Each request sends it along, it’s used once, then dropped. On a new
          device or browser, enter it again.
        </p>
        <p>
          New to this? Follow{" "}
          <a href={GEMINI_KEY_GUIDE} target="_blank" rel="noreferrer" className="font-medium text-accent">
            Google’s guide to getting a Gemini API key
          </a>
          , or go straight to{" "}
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-accent"
          >
            Google AI Studio
          </a>
          . On the free tier, Google may use what you send to improve its products.
        </p>
      </div>
    </section>
  );
}
