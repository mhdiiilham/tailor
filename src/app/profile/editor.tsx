"use client";

import { useActionState, useRef } from "react";
import { saveProfile, type ActionState } from "@/app/actions";
import { Field, FormMessage, SubmitButton, TextArea, buttonClass } from "@/components/ui";

export function ProfileEditor({ initialYaml }: { initialYaml: string }) {
  const [state, action] = useActionState<ActionState, FormData>(saveProfile, {});
  const textarea = useRef<HTMLTextAreaElement>(null);

  // Reads the file in the browser and drops it into the editor; saving validates it.
  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && textarea.current) textarea.current.value = await file.text();
    e.target.value = "";
  }

  return (
    <form action={action} className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label htmlFor="yaml" className="text-sm font-medium">
          Profile YAML
        </label>
        <label className={buttonClass("secondary", "cursor-pointer")}>
          Upload profile.yaml
          <input type="file" accept=".yaml,.yml,text/yaml" onChange={upload} className="sr-only" />
        </label>
      </div>
      <Field
        htmlFor="yaml"
        hint="Same shape as profile.yaml. Uploading replaces the text here; nothing is saved until you press Save."
      >
        <TextArea
          ref={textarea}
          id="yaml"
          name="yaml"
          defaultValue={initialYaml}
          rows={28}
          spellCheck={false}
          wrap="off"
          mono
        />
      </Field>
      <FormMessage {...state} />
      <div>
        <SubmitButton pendingLabel="Saving...">Save profile</SubmitButton>
      </div>
    </form>
  );
}
