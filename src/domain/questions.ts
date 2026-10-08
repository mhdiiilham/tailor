import { z } from "zod";

export const QuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
});

export type Question = z.infer<typeof QuestionSchema>;

export const FIXED_QUESTIONS: Question[] = [
  {
    id: "lead",
    question:
      "What is the one thing you most want this application to lead with? What should the hiring manager remember about you?",
  },
  {
    id: "tone",
    question:
      "Tone check: the default is warm, direct and confident, not corporate and not self-congratulatory. Any adjustments?",
  },
];

export const MAX_GAP_QUESTIONS = 4;
export const MAX_QUESTIONS = FIXED_QUESTIONS.length + MAX_GAP_QUESTIONS;

// One interview turn. Flat on purpose: small local models handle it reliably.
export const NextQuestionSchema = z.object({
  done: z.boolean().describe("true when no further question would improve the resume"),
  question: z.string().describe("The single next question, or an empty string when done"),
});

export type NextQuestion = { done: true } | { done: false; question: string };

export type Answers = Record<string, string>;
