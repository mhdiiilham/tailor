"use client";

import { useActionState } from "react";
import { generateResume, reviseResume, type ActionState } from "@/app/actions";
import type { Answers, Question } from "@/domain/questions";
import { Field, FormMessage, SubmitButton } from "@/components/ui";
import { inputStyles } from "@/components/styles";

export function QuestionsForm({ id, questions, answers }: { id: number; questions: Question[]; answers: Answers }) {
  const [state, action] = useActionState<ActionState, FormData>(generateResume.bind(null, id), {});
  return (
    <form action={action} className="grid gap-6">
      {questions.map((q) => (
        <Field key={q.id} label={q.question} htmlFor={`q-${q.id}`}>
          <textarea id={`q-${q.id}`} name={`q:${q.id}`} rows={3} defaultValue={answers[q.id] ?? ""} className={inputStyles} />
        </Field>
      ))}
      <FormMessage {...state} />
      <div>
        <SubmitButton pendingLabel="Writing your resume...">Generate resume</SubmitButton>
      </div>
    </form>
  );
}

export function ReviseForm({ id }: { id: number }) {
  const [state, action] = useActionState<ActionState, FormData>(reviseResume.bind(null, id), {});
  return (
    <form action={action} className="grid gap-3">
      <Field label="Ask for a change" htmlFor="feedback" hint="For example: lead with the Pub/Sub work, drop the KlikACC role.">
        <textarea id="feedback" name="feedback" rows={3} className={inputStyles} />
      </Field>
      <FormMessage {...state} />
      <div>
        <SubmitButton variant="secondary" pendingLabel="Revising...">
          Revise
        </SubmitButton>
      </div>
    </form>
  );
}
