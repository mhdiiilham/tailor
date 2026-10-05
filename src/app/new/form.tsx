"use client";

import type { Profile } from "@/domain/profile";
import { RequireGeminiKey } from "@/components/geminiKey";
import { FormMessage, PendingSteps, SubmitButton, TextArea } from "@/components/ui";
import { ANALYZE_NOTE, ANALYZE_STEPS } from "./analyzeSteps";
import { useAnalyze } from "./useAnalyze";

// The quick-paste panel on the dashboard. The full page is ./workspace.
export function NewApplicationForm({ profile }: { profile: Profile }) {
  const { analyze, busy, step, error } = useAnalyze(profile);
  return (
    <RequireGeminiKey>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          analyze(String(new FormData(e.currentTarget).get("jd") ?? ""));
        }}
        className="grid gap-3"
      >
        <TextArea
          name="jd"
          required
          rows={4}
          mono
          aria-label="Job description"
          placeholder="Paste the full job description here"
        />
        {busy ? (
          <PendingSteps title="Analyzing your fit" steps={ANALYZE_STEPS} active={step} note={ANALYZE_NOTE} />
        ) : null}
        <FormMessage error={error} />
        <div className="flex justify-end">
          <SubmitButton pending={busy} pendingLabel="Reading the posting...">
            Analyze fit
          </SubmitButton>
        </div>
      </form>
    </RequireGeminiKey>
  );
}
