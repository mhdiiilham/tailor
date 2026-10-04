"use client";

import { useActionState, useRef } from "react";
import { generateResume, reviseResume, type ActionState } from "@/app/actions";
import type { Answers, Question } from "@/domain/questions";
import { GeminiKeyInput, RequireGeminiKey } from "@/components/geminiKey";
import { Field, FormMessage, SubmitButton, TextArea } from "@/components/ui";

export function QuestionsForm({ id, questions, answers }: { id: number; questions: Question[]; answers: Answers }) {
  const [state, action] = useActionState<ActionState, FormData>(generateResume.bind(null, id), {});
  return (
    <RequireGeminiKey>
      <form action={action} className="grid gap-6">
        <GeminiKeyInput />
        {questions.map((q) => (
          <Field key={q.id} label={q.question} htmlFor={`q-${q.id}`}>
            <TextArea id={`q-${q.id}`} name={`q:${q.id}`} rows={3} defaultValue={answers[q.id] ?? ""} />
          </Field>
        ))}
        <FormMessage {...state} />
        <div>
          <SubmitButton pendingLabel="Writing your resume...">Generate resume</SubmitButton>
        </div>
      </form>
    </RequireGeminiKey>
  );
}

const SUGGESTIONS = [
  "Keep it to one page",
  "Lead with the strongest angle",
  "Add numbers to every bullet",
  "Mirror the job description's wording more closely",
];

export function ReviseForm({ id }: { id: number }) {
  const [state, action] = useActionState<ActionState, FormData>(reviseResume.bind(null, id), {});
  const feedback = useRef<HTMLTextAreaElement>(null);

  // Chips only fill in the request; nothing runs until Revise is pressed.
  function suggest(text: string) {
    const box = feedback.current;
    if (!box) return;
    box.value = box.value.trim() ? `${box.value.trim()}\n${text}` : text;
    box.focus();
  }

  return (
    <RequireGeminiKey>
      <form action={action} className="grid gap-3">
        <GeminiKeyInput />
        <Field label="Ask for a revision" htmlFor="feedback">
          <TextArea
            ref={feedback}
            id="feedback"
            name="feedback"
            rows={3}
            placeholder="e.g. Lead with the Pub/Sub work, drop the KlikACC role."
          />
        </Field>
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((text) => (
            <button
              key={text}
              type="button"
              onClick={() => suggest(text)}
              className="rounded-chip border border-line bg-sunken px-2.5 py-1 text-xs text-muted transition-colors hover:border-faint hover:text-ink"
            >
              + {text}
            </button>
          ))}
        </div>
        <FormMessage {...state} />
        <div className="flex justify-end">
          <SubmitButton pendingLabel="Revising...">Revise resume</SubmitButton>
        </div>
      </form>
    </RequireGeminiKey>
  );
}
