import { z } from "zod";

// What the model returns. The letter itself is stored and shown as plain text.
export const CoverLetterSchema = z.object({
  paragraphs: z.array(z.string()).min(3).max(4).describe("The letter body: 3 or 4 plain-text paragraphs"),
});
export type CoverLetterDraft = z.infer<typeof CoverLetterSchema>;

export function coverLetterText(draft: CoverLetterDraft, name: string): string {
  const body = draft.paragraphs
    .map((p) => p.trim())
    .filter(Boolean)
    .join("\n\n");
  return `${body}\n\nBest regards,\n${name}`;
}
