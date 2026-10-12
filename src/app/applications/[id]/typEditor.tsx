"use client";

import { useRef, useState, useTransition } from "react";
import { saveTypSource } from "@/app/actions";
import { CodeEditor, type CodeEditorHandle } from "@/components/codeEditor";
import { Button, FormMessage } from "@/components/ui";

// Edit the stored Typst source by hand. Saving compiles it on the server; a source that
// doesn't compile is never stored, and Typst's error shows here with the line number.
export function TypEditor({ id, source }: { id: number; source: string }) {
  const editor = useRef<CodeEditorHandle>(null);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [saving, startSaving] = useTransition();

  function save() {
    const text = editor.current?.value() ?? "";
    setError(undefined);
    setNotice(undefined);
    startSaving(async () => {
      const result = await saveTypSource(id, text);
      if (result.error) setError(result.error);
      else setNotice("Saved. The preview and PDF now use your edit.");
    });
  }

  function reset() {
    editor.current?.setValue(source);
    setError(undefined);
    setNotice(undefined);
  }

  return (
    <div className="grid gap-3">
      <CodeEditor ref={editor} initialValue={source} label="Typst source" />
      {error ? (
        <pre role="alert" className="overflow-x-auto whitespace-pre font-mono text-xs text-danger">
          {error}
        </pre>
      ) : (
        <FormMessage notice={notice} />
      )}
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={reset} disabled={saving}>
          Reset
        </Button>
        <Button onClick={save} disabled={saving}>
          {saving ? "Compiling..." : "Save and compile"}
        </Button>
      </div>
    </div>
  );
}
