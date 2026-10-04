"use client";

import { CheckCircle, Info, Warning } from "@phosphor-icons/react";
import { useActionState, useMemo, useRef, useState } from "react";
import { startApplication, type ActionState } from "@/app/actions";
import { GeminiKeyInput, RequireGeminiKey } from "@/components/geminiKey";
import { Badge, Button, Card, FormMessage, PendingSteps, SectionHeader, SubmitButton } from "@/components/ui";
import { ANALYZE_NOTE, ANALYZE_STEPS } from "./analyzeSteps";
import { checkTerms, looksComplete } from "@/domain/techTerms";

// Gemini counts roughly four characters per token for English text.
const estimateTokens = (text: string) => Math.ceil(text.length / 4);

function CheckRow({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      {ok ? (
        <CheckCircle size={17} weight="fill" className="mt-px shrink-0 text-good" />
      ) : (
        <Warning size={17} weight="fill" className="mt-px shrink-0 text-warn" />
      )}
      <span className={ok ? "text-muted" : "text-ink"}>{children}</span>
    </li>
  );
}

// Runs in the browser on every keystroke; no AI call is made until "Analyze fit".
function QuickCheck({ text, terms }: { text: string; terms: string[] }) {
  const check = useMemo(() => checkTerms(text, terms), [text, terms]);
  const { tooShort, noRequirements } = looksComplete(text);

  return (
    <Card>
      <SectionHeader title="Quick check" description="Runs in your browser before anything is sent to Gemini." />
      {!text.trim() ? (
        <p className="text-sm text-faint">Paste a posting to see which of its tech your profile covers.</p>
      ) : (
        <>
          <ul className="grid gap-2">
            <CheckRow ok={!tooShort}>
              {tooShort ? "Looks too short for a full posting" : "Long enough to analyze"}
            </CheckRow>
            <CheckRow ok={!noRequirements}>
              {noRequirements
                ? "No requirements section found. Did the whole posting paste?"
                : "Has a requirements section"}
            </CheckRow>
          </ul>

          <div className="grid gap-2">
            <p className="font-mono text-[11px] uppercase tracking-wider text-faint">In your profile</p>
            {check.inProfile.length ? (
              <div className="flex flex-wrap gap-1.5">
                {check.inProfile.map((t) => (
                  <Badge key={t} tone="good" mono>
                    {t}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-faint">None of the tech mentioned so far.</p>
            )}
          </div>

          {check.notInProfile.length ? (
            <div className="grid gap-2">
              <p className="font-mono text-[11px] uppercase tracking-wider text-faint">Not in your profile</p>
              <div className="flex flex-wrap gap-1.5">
                {check.notInProfile.map((t) => (
                  <Badge key={t} tone="warn" mono>
                    {t}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-faint">
                The analysis will ask how you want to handle these. Nothing gets added to your resume unless your
                profile backs it.
              </p>
            </div>
          ) : null}
        </>
      )}
    </Card>
  );
}

export function NewApplicationWorkspace({ terms, profileCard }: { terms: string[]; profileCard: React.ReactNode }) {
  const [state, action] = useActionState<ActionState, FormData>(startApplication, {});
  const [text, setText] = useState("");
  const form = useRef<HTMLFormElement>(null);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <RequireGeminiKey>
        <form ref={form} action={action} className="overflow-hidden rounded-card border border-line bg-raised">
          <GeminiKeyInput />
          <div className="flex items-center justify-between gap-3 border-b border-line bg-sunken px-5 py-3">
            <label htmlFor="jd" className="text-sm font-medium">
              Job description
            </label>
            <span className="font-mono text-xs text-faint">
              {text.length.toLocaleString()} chars · ~{estimateTokens(text).toLocaleString()} tokens
            </span>
          </div>
          <textarea
            id="jd"
            name="jd"
            required
            rows={20}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) form.current?.requestSubmit();
            }}
            placeholder={"Role: Backend Engineer\nCompany: ...\n\nRequirements:\n- ..."}
            className="block w-full resize-y bg-raised px-5 py-4 font-mono text-[13.5px] leading-relaxed text-ink placeholder:text-faint focus:outline-none"
          />
          <div className="grid gap-3 border-t border-line bg-sunken px-5 py-3">
            <PendingSteps title="Analyzing your fit" steps={ANALYZE_STEPS} note={ANALYZE_NOTE} />
            <FormMessage {...state} />
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button variant="ghost" className="px-3" onClick={() => setText("")} disabled={!text}>
                Clear
              </Button>
              <SubmitButton pendingLabel="Reading the posting...">
                Analyze fit
                <kbd className="rounded-chip border border-on-accent/30 px-1.5 font-mono text-[10px]">⌘↵</kbd>
              </SubmitButton>
            </div>
          </div>
        </form>
      </RequireGeminiKey>

      <div className="grid gap-6 lg:sticky lg:top-24">
        {profileCard}
        <QuickCheck text={text} terms={terms} />
      </div>

      <Card className="lg:col-span-2">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-ui bg-accent-soft text-accent">
            <Info size={18} weight="fill" />
          </span>
          <SectionHeader
            title="What happens next"
            description="Gemini reads the posting and scores your fit against your profile. You then answer two to six questions about the gaps. Only after that is the resume written, and it only uses what your profile backs up."
          />
        </div>
      </Card>
    </div>
  );
}
