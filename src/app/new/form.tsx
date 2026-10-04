"use client";

import { useActionState } from "react";
import { startApplication, type ActionState } from "@/app/actions";
import { GeminiKeyInput, RequireGeminiKey } from "@/components/geminiKey";
import { Field, FormMessage, SubmitButton, TextArea } from "@/components/ui";

export function NewApplicationForm() {
  const [state, action] = useActionState<ActionState, FormData>(startApplication, {});
  return (
    <RequireGeminiKey>
      <form action={action} className="grid gap-5 rounded-card border border-line bg-raised p-5 md:p-6">
        <GeminiKeyInput />
        <Field label="Job description" htmlFor="jd" hint="Include the title, company, requirements and nice-to-haves.">
          <TextArea id="jd" name="jd" required rows={18} mono />
        </Field>
        <FormMessage {...state} />
        <div>
          <SubmitButton pendingLabel="Reading the posting...">Analyze fit</SubmitButton>
        </div>
      </form>
    </RequireGeminiKey>
  );
}
