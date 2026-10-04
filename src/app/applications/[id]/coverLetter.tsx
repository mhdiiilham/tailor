"use client";

import { ArrowsClockwise, Check, Copy, EnvelopeSimple } from "@phosphor-icons/react";
import { useActionState, useEffect, useState } from "react";
import { writeCoverLetter, type ActionState } from "@/app/actions";
import { GeminiKeyInput, RequireGeminiKey } from "@/components/geminiKey";
import { cancelScrollToResult, requestScrollToResult } from "@/components/scrollToResult";
import {
  Button,
  Card,
  FormMessage,
  PendingSteps,
  SectionHeader,
  SubmitButton,
  type PendingStep,
} from "@/components/ui";

const STEPS: PendingStep[] = [
  { label: "Drafting from your resume and the job description", startsAt: 0 },
  { label: "Humanizing pass: removing AI-sounding phrasing", startsAt: 10 },
  { label: "Final check for leftover clichés", startsAt: 20 },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          // Clipboard blocked; the text can still be selected by hand.
        }
      }}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

// The cover letter as plain text, ready to paste into an email or an application form.
export function CoverLetterPanel({ id, text }: { id: number; text: string | null }) {
  const [state, action] = useActionState<ActionState, FormData>(writeCoverLetter.bind(null, id), {});
  useEffect(() => {
    if (state.error) cancelScrollToResult();
  }, [state.error]);
  const words = text ? text.split(/\s+/).filter(Boolean).length : 0;

  return (
    <Card>
      <SectionHeader
        icon={<EnvelopeSimple size={18} />}
        title="Cover letter"
        description={
          text
            ? "Plain text, ready to paste into an email or an application form."
            : "Written in your voice from this resume and the job description, then run through a humanizer pass so it doesn't read like AI."
        }
        aside={text ? <CopyButton text={text} /> : null}
      />

      {text ? (
        <div className="grid max-w-3xl gap-2">
          <div className="max-h-[560px] overflow-y-auto whitespace-pre-wrap rounded-ui border border-line bg-sunken p-5 text-[15px] leading-relaxed">
            {text}
          </div>
          <p className="font-mono text-xs text-faint">{words} words</p>
        </div>
      ) : null}

      <RequireGeminiKey>
        <form action={action} onSubmit={() => requestScrollToResult(id)} className="grid gap-3">
          <GeminiKeyInput />
          <PendingSteps
            title={text ? "Rewriting your cover letter" : "Writing your cover letter"}
            steps={STEPS}
            note="Usually takes 20 to 40 seconds."
          />
          <FormMessage {...state} />
          <div>
            <SubmitButton variant={text ? "secondary" : "primary"} pendingLabel="Writing...">
              {text ? <ArrowsClockwise size={16} /> : <EnvelopeSimple size={16} />}
              {text ? "Write a new version" : "Generate cover letter"}
            </SubmitButton>
          </div>
        </form>
      </RequireGeminiKey>
    </Card>
  );
}
