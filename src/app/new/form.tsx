"use client";

import { useActionState } from "react";
import { startApplication, type ActionState } from "@/app/actions";
import { GeminiKeyInput, RequireGeminiKey } from "@/components/geminiKey";
import { FormMessage, PendingSteps, SubmitButton, TextArea } from "@/components/ui";
import { ANALYZE_NOTE, ANALYZE_STEPS } from "./analyzeSteps";

// The quick-paste panel on the dashboard. The full page is ./workspace.
export function NewApplicationForm() {
  const [state, action] = useActionState<ActionState, FormData>(startApplication, {});
  return (
    <RequireGeminiKey>
      <form action={action} className="grid gap-3">
        <GeminiKeyInput />
        <TextArea
          name="jd"
          required
          rows={4}
          mono
          aria-label="Job description"
          placeholder="Paste the full job description here"
        />
        <PendingSteps title="Analyzing your fit" steps={ANALYZE_STEPS} note={ANALYZE_NOTE} />
        <FormMessage {...state} />
        <div className="flex justify-end">
          <SubmitButton pendingLabel="Reading the posting...">Analyze fit</SubmitButton>
        </div>
      </form>
    </RequireGeminiKey>
  );
}
