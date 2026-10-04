"use client";

import { useActionState } from "react";
import { importProfileYaml, saveProfile, type ActionState } from "@/app/actions";
import { Field, FormMessage, SubmitButton } from "@/components/ui";
import { inputStyles } from "@/components/styles";

export function ImportProfileButton({ replacing }: { replacing: boolean }) {
  const [state, action] = useActionState<ActionState>(importProfileYaml, {});
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (replacing && !confirm("Replace the saved profile with profile.yaml? Edits made here will be lost.")) {
          e.preventDefault();
        }
      }}
      className="grid gap-2 md:justify-items-end"
    >
      <SubmitButton variant={replacing ? "secondary" : "primary"} pendingLabel="Importing...">
        {replacing ? "Re-import profile.yaml" : "Import profile.yaml"}
      </SubmitButton>
      <FormMessage {...state} />
    </form>
  );
}

export function ProfileEditor({ initialYaml }: { initialYaml: string }) {
  const [state, action] = useActionState<ActionState, FormData>(saveProfile, {});
  return (
    <form action={action} className="grid gap-5">
      <Field
        label="Edit profile"
        htmlFor="yaml"
        hint="Same shape as profile.yaml. Dates are YYYY-MM, or present. Saved to the local database, not back to the file."
      >
        <textarea
          id="yaml"
          name="yaml"
          defaultValue={initialYaml}
          rows={28}
          spellCheck={false}
          wrap="off"
          className={`${inputStyles} font-mono text-[13px]`}
        />
      </Field>
      <FormMessage {...state} />
      <div>
        <SubmitButton pendingLabel="Saving...">Save profile</SubmitButton>
      </div>
    </form>
  );
}
