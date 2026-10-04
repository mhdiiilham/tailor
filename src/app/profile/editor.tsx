"use client";

import { useActionState, useRef } from "react";
import { saveProfile, type ActionState } from "@/app/actions";
import { Button, Field, FormMessage, SubmitButton, TextArea, buttonClass } from "@/components/ui";
import { PROFILE_TEMPLATE } from "./profileGuide";

export function ProfileEditor({ initialYaml }: { initialYaml: string }) {
  const [state, action] = useActionState<ActionState, FormData>(saveProfile, {});
  const textarea = useRef<HTMLTextAreaElement>(null);

  // Reads the file in the browser and drops it into the editor; saving validates it.
  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && textarea.current) textarea.current.value = await file.text();
    e.target.value = "";
  }

  function useTemplate() {
    const box = textarea.current;
    if (!box) return;
    if (
      box.value.trim() &&
      !confirm("Replace what's in the editor with the template? Nothing is saved until you press Save.")
    )
      return;
    box.value = PROFILE_TEMPLATE;
    box.focus();
  }

  return (
    <form action={action} className="grid min-w-0 gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label htmlFor="yaml" className="text-sm font-medium">
          Profile YAML
        </label>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={useTemplate}>
            Start from template
          </Button>
          <label className={buttonClass("secondary", "cursor-pointer")}>
            Upload profile.yaml
            <input type="file" accept=".yaml,.yml,text/yaml" onChange={upload} className="sr-only" />
          </label>
        </div>
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
