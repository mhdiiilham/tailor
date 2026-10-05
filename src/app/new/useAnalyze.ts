"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { analyzeTrackedApplication, createApplication } from "@/app/actions";
import { MIN_JD_LENGTH } from "@/application/applications";
import { analyzeJob } from "@/application/workflows";
import type { Profile } from "@/domain/profile";
import { useAiTask } from "@/components/useAiTask";

// "Analyze fit": Gemini runs in the browser, then the result is saved and opened.
// With trackedId, the analysis goes into that tracked job instead of a new application.
export function useAnalyze(profile: Profile, { trackedId }: { trackedId?: number } = {}) {
  const router = useRouter();
  const task = useAiTask();
  const [navigating, startNavigation] = useTransition();

  async function analyze(jdText: string) {
    await task.run(async (llm, onStep) => {
      // Checked before any Gemini call, so a bad paste costs nothing.
      if (jdText.trim().length < MIN_JD_LENGTH) {
        return { error: "That looks too short for a job description. Paste the whole posting." };
      }
      const analysis = await analyzeJob(llm, profile, jdText, onStep);
      if (trackedId) {
        const result = await analyzeTrackedApplication(trackedId, { jdText, ...analysis });
        if (!result.error) startNavigation(() => router.refresh());
        return result;
      }
      const saved = await createApplication({ jdText, ...analysis });
      if (saved.id) startNavigation(() => router.push(`/applications/${saved.id}`));
      return saved;
    });
  }

  // Stays busy until the new page opens, so the form never looks idle in between.
  return { ...task, busy: task.running || navigating, analyze };
}
