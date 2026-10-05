"use client";

import { useState } from "react";
import type { Profile } from "@/domain/profile";
import { RequireGeminiKey } from "@/components/geminiKey";
import { FormMessage, PendingSteps, SubmitButton, TextArea } from "@/components/ui";
import { ANALYZE_NOTE, ANALYZE_STEPS } from "@/app/new/analyzeSteps";
import { useAnalyze } from "@/app/new/useAnalyze";

// Paste the job description of a tracked job to analyze it and tailor a resume.
// It stays the same application, with its stage, dates, link and notes.
export function AnalyzeTrackedForm({ id, profile }: { id: number; profile: Profile }) {
  const { analyze, busy, step, error } = useAnalyze(profile, { trackedId: id });
  const [text, setText] = useState("");

  return (
    <RequireGeminiKey>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          analyze(text);
        }}
        className="grid gap-3"
      >
        <TextArea
          name="jd"
          required
          rows={8}
          mono
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label="Job description"
          placeholder="Paste the full job description here"
        />
        {busy ? (
          <PendingSteps title="Analyzing your fit" steps={ANALYZE_STEPS} active={step} note={ANALYZE_NOTE} />
        ) : null}
        <FormMessage error={error} />
        <div>
          <SubmitButton pending={busy} pendingLabel="Reading the posting...">
            Analyze and tailor
          </SubmitButton>
        </div>
      </form>
    </RequireGeminiKey>
  );
}
