"use client";

import { useActionState } from "react";
import { startApplication, type ActionState } from "@/app/actions";
import { GeminiKeyInput, RequireGeminiKey } from "@/components/geminiKey";
import { Field, FormMessage, SubmitButton, TextArea } from "@/components/ui";

// Full page form on /new; `compact` is the quick-paste panel on the dashboard.
export function NewApplicationForm({ compact = false }: { compact?: boolean }) {
  const [state, action] = useActionState<ActionState, FormData>(startApplication, {});
  return (
    <RequireGeminiKey>
      <form
        action={action}
        className={compact ? "grid gap-3" : "grid gap-5 rounded-card border border-line bg-raised p-5 md:p-6"}
      >
        <GeminiKeyInput />
        <Field
          label={compact ? undefined : "Job description"}
          htmlFor={compact ? "jd-quick" : "jd"}
          hint={compact ? undefined : "Include the title, company, requirements and nice-to-haves."}
        >
          <TextArea
            id={compact ? "jd-quick" : "jd"}
            name="jd"
            required
            rows={compact ? 4 : 18}
            mono
            aria-label="Job description"
            placeholder={compact ? "Paste the full job description here" : undefined}
          />
        </Field>
        <FormMessage {...state} />
        <div className={compact ? "flex justify-end" : undefined}>
          <SubmitButton pendingLabel="Reading the posting...">Analyze fit</SubmitButton>
        </div>
      </form>
    </RequireGeminiKey>
  );
}
