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
];

export const MAX_GAP_QUESTIONS = 4;

export type Answers = Record<string, string>;
