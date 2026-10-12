"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { basicSetup, EditorView } from "codemirror";
import { saveTypSource } from "@/app/actions";
import { Button, FormMessage } from "@/components/ui";

// Colors come from the app's tokens, so the editor follows light and dark mode.
const theme = EditorView.theme({
  "&": { backgroundColor: "var(--surface-sunken)", color: "var(--ink)", fontSize: "13px", maxHeight: "36rem" },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": { fontFamily: "var(--font-mono, ui-monospace, monospace)", lineHeight: "1.6" },
  ".cm-content": { caretColor: "var(--ink)" },
  ".cm-gutters": { backgroundColor: "var(--surface-sunken)", color: "var(--faint)", borderRight: "1px solid var(--line)" },
  ".cm-activeLine, .cm-activeLineGutter": { backgroundColor: "var(--accent-soft)" },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": { backgroundColor: "var(--accent-soft)" },
});

// Edit the stored Typst source by hand. Saving compiles it on the server; a source that
// doesn't compile is never stored, and Typst's error shows here with the line number.
export function TypEditor({ id, source }: { id: number; source: string }) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [saving, startSaving] = useTransition();

  useEffect(() => {
    const editor = new EditorView({ doc: source, extensions: [basicSetup, theme], parent: host.current! });
    view.current = editor;
    return () => editor.destroy();
  }, [source]);

  function save() {
    const text = view.current?.state.doc.toString() ?? "";
    setError(undefined);
    setNotice(undefined);
    startSaving(async () => {
      const result = await saveTypSource(id, text);
      if (result.error) setError(result.error);
      else setNotice("Saved. The preview and PDF now use your edit.");
    });
  }

  function reset() {
    const editor = view.current;
    if (!editor) return;
    editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: source } });
    setError(undefined);
    setNotice(undefined);
  }

  return (
    <div className="grid gap-3">
      <div ref={host} className="overflow-hidden rounded-ui border border-line focus-within:border-accent" />
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
