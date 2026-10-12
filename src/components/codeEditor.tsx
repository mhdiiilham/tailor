"use client";

import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import { basicSetup, EditorView } from "codemirror";

// Colors come from the app's tokens, so the editor follows light and dark mode.
// The selection selector matches CodeMirror's own, which is more specific than a bare class.
const theme = EditorView.theme({
  "&": { backgroundColor: "var(--surface-sunken)", color: "var(--ink)", fontSize: "13px", maxHeight: "36rem" },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": { fontFamily: "var(--font-mono, ui-monospace, monospace)", lineHeight: "1.6" },
  ".cm-content": { caretColor: "var(--ink)" },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--ink)" },
  ".cm-gutters": { backgroundColor: "var(--surface-sunken)", color: "var(--faint)", borderRight: "1px solid var(--line)" },
  ".cm-activeLine, .cm-activeLineGutter": { backgroundColor: "color-mix(in srgb, var(--ink) 5%, transparent)" },
  "& > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, &.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground":
    { backgroundColor: "color-mix(in srgb, var(--accent) 35%, transparent)" },
  ".cm-selectionMatch": { backgroundColor: "color-mix(in srgb, var(--accent) 18%, transparent)" },
});

export type CodeEditorHandle = { value(): string; setValue(text: string): void; focus(): void };

// A plain-text code editor (line numbers, search, undo, bracket matching).
// With `name`, a hidden input mirrors the text so the editor works inside a <form>. It's
// controlled, so React's reset after a form action can't swap in stale text.
export function CodeEditor({
  initialValue,
  name,
  label,
  ref,
}: {
  initialValue: string;
  name?: string;
  label: string;
  ref?: Ref<CodeEditorHandle>;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [text, setText] = useState(initialValue);
  const [shown, setShown] = useState(initialValue);
  // A new initial value (after a save, say) rebuilds the editor below; the form value follows.
  if (shown !== initialValue) {
    setShown(initialValue);
    setText(initialValue);
  }
  const view = useRef<EditorView | null>(null);

  useEffect(() => {
    const editor = new EditorView({
      doc: initialValue,
      extensions: [
        basicSetup,
        theme,
        EditorView.contentAttributes.of({ "aria-label": label }),
        EditorView.updateListener.of((u) => {
          if (u.docChanged) setText(u.state.doc.toString());
        }),
      ],
      parent: host.current!,
    });
    view.current = editor;
    return () => editor.destroy();
  }, [initialValue, label]);

  useImperativeHandle(ref, () => ({
    value: () => view.current?.state.doc.toString() ?? "",
    setValue(text) {
      const editor = view.current;
      editor?.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: text } });
    },
    focus: () => view.current?.focus(),
  }));

  return (
    <>
      <div ref={host} className="overflow-hidden rounded-ui border border-line focus-within:border-accent" />
      {name ? <input type="hidden" name={name} value={text} readOnly /> : null}
    </>
  );
}
