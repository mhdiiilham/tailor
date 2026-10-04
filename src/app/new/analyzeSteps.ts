import type { PendingStep } from "@/components/ui";

// The three Gemini calls behind "Analyze fit", with rough timings.
export const ANALYZE_STEPS: PendingStep[] = [
  { label: "Reading the job description", startsAt: 0 },
  { label: "Matching it against your profile", startsAt: 6 },
  { label: "Writing questions about the gaps", startsAt: 14 },
];

export const ANALYZE_NOTE = "Usually takes 10 to 30 seconds. You can keep this tab open while it works.";
