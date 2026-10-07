import type { BadgeTone } from "@/components/ui";
import type { WorkMode } from "@/domain/hn";

// Plain values shared by the job list and the job page. They live outside postParts.tsx
// because that file is a client module, and a server page can't read values from one.

export const MODE_LABEL: Record<WorkMode, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "Onsite",
  unknown: "",
};
export const MODE_TONE: Record<WorkMode, BadgeTone> = {
  remote: "good",
  hybrid: "accent",
  onsite: "neutral",
  unknown: "neutral",
};

// Sign in on the home page, then go on to `next`.
export const signInHref = (next: string) => `/?next=${encodeURIComponent(next)}#signin`;
