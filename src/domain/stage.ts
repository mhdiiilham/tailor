import { z } from "zod";

// Where the job application itself stands. Separate from the resume's status
// ("questions" / "generated"), which is about the tailoring work.
export const STAGES = ["not_applied", "applied", "interviewing", "offer", "rejected", "withdrawn"] as const;
export const StageSchema = z.enum(STAGES);
export type Stage = z.infer<typeof StageSchema>;

export const STAGE_LABELS: Record<Stage, string> = {
  not_applied: "Not applied",
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export const CLOSED_STAGES: Stage[] = ["rejected", "withdrawn"];

export type StageFields = { stage: Stage; stageUpdatedAt: Date | null; appliedAt: Date | null };

// The fields to store when an application moves to `next`. The applied date is
// set the first time it leaves "Not applied" and kept after that.
export function moveToStage(current: StageFields, next: Stage, now: Date): StageFields {
  if (current.stage === next) return current;
  const applied = next !== "not_applied";
  return {
    stage: next,
    stageUpdatedAt: now,
    appliedAt: current.appliedAt ?? (applied ? now : null),
  };
}
