"use client";

import { ArrowsClockwise, Check, Copy, EnvelopeSimple } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { saveCoverLetter } from "@/app/actions";
import { draftCoverLetter, type ApplicationContext } from "@/application/workflows";
import type { Profile } from "@/domain/profile";
import { RequireGeminiKey } from "@/components/geminiKey";
import { cancelScrollToResult, requestScrollToResult } from "@/components/scrollToResult";
import { useAiTask } from "@/components/useAiTask";
import { Button, Card, FormMessage, PendingSteps, SectionHeader, SubmitButton } from "@/components/ui";

// The two steps of draftCoverLetter, in order.
const STEPS = ["Drafting from your resume and the job description", "Checking for AI-sounding phrasing"];

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
export function CoverLetterPanel({
  id,
  text,
  profile,
  app,
}: {
  id: number;
  text: string | null;
  profile: Profile;
  app: ApplicationContext;
}) {
  const { run, running, step, error } = useAiTask();
  useEffect(() => {
    if (error) cancelScrollToResult();
  }, [error]);

  function write() {
    requestScrollToResult(id);
    run(async (llm, onStep) => saveCoverLetter(id, await draftCoverLetter(llm, profile, app, onStep)));
  }
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
        <form
          onSubmit={(e) => {
            e.preventDefault();
            write();
          }}
          className="grid gap-3"
        >
          {running ? (
            <PendingSteps
              title={text ? "Rewriting your cover letter" : "Writing your cover letter"}
              steps={STEPS}
              active={step}
              note="Usually takes 20 to 40 seconds."
            />
          ) : null}
          <FormMessage error={error} />
          <div>
            <SubmitButton pending={running} variant={text ? "secondary" : "primary"} pendingLabel="Writing...">
              {text ? <ArrowsClockwise size={16} /> : <EnvelopeSimple size={16} />}
              {text ? "Write a new version" : "Generate cover letter"}
            </SubmitButton>
          </div>
        </form>
      </RequireGeminiKey>
    </Card>
  );
}
