"use client";

import { useActionState } from "react";
import { startApplication, type ActionState } from "@/app/actions";
import { Field, FormMessage, SubmitButton } from "@/components/ui";
import { inputStyles } from "@/components/styles";

export function NewApplicationForm() {
  const [state, action] = useActionState<ActionState, FormData>(startApplication, {});
  return (
    <form action={action} className="grid gap-5">
      <Field label="Job description" htmlFor="jd" hint="Include the title, company, requirements and nice-to-haves.">
        <textarea id="jd" name="jd" required rows={18} className={`${inputStyles} font-mono text-sm`} />
      </Field>
      <FormMessage {...state} />
      <div>
        <SubmitButton pendingLabel="Reading the posting...">Analyze fit</SubmitButton>
      </div>
    </form>
  );
}
