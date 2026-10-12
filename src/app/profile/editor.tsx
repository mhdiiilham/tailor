"use client";

import { useActionState, useRef } from "react";
import { saveProfile, type ActionState } from "@/app/actions";
import { CodeEditor, type CodeEditorHandle } from "@/components/codeEditor";
import { Button, FormMessage, SubmitButton, buttonClass } from "@/components/ui";
import { PROFILE_TEMPLATE } from "./profileGuide";

export function ProfileEditor({ initialYaml }: { initialYaml: string }) {
  const [state, action] = useActionState<ActionState, FormData>(saveProfile, {});
  const editor = useRef<CodeEditorHandle>(null);

  // Reads the file in the browser and drops it into the editor; saving validates it.
  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) editor.current?.setValue(await file.text());
    e.target.value = "";
  }

  function useTemplate() {
    const box = editor.current;
    if (!box) return;
    if (
      box.value().trim() &&
      !confirm("Replace what's in the editor with the template? Nothing is saved until you press Save.")
    )
      return;
    box.setValue(PROFILE_TEMPLATE);
    box.focus();
  }

  return (
    <form action={action} className="grid min-w-0 gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-medium">Profile YAML</h2>
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
      <div className="grid gap-2">
        <CodeEditor ref={editor} name="yaml" initialValue={initialYaml} label="Profile YAML" />
        <p className="text-sm text-faint">
          Same shape as profile.yaml. Uploading replaces the text here; nothing is saved until you press Save.
        </p>
      </div>
      <FormMessage {...state} />
      <div>
        <SubmitButton pendingLabel="Saving...">Save profile</SubmitButton>
      </div>
    </form>
  );
}
