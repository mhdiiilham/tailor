"use client";

import { useState } from "react";
import type { ActionState } from "@/app/actions";
import type { OnStep } from "@/application/workflows";
import { MissingApiKeyError } from "@/domain/errors";
import type { LlmPort } from "@/domain/ports";
import { describeAiFailure } from "@/infrastructure/llm/geminiErrors";
import { GeminiLlm } from "@/infrastructure/llm/geminiLlm";
import { useGeminiKey } from "./geminiKey";
import { recordGeminiCall } from "./geminiUsage";

export type AiTaskState = { running: boolean; step: number; error?: string; notice?: string };

type Task = (llm: LlmPort, onStep: OnStep) => Promise<ActionState | void>;

// Runs one AI use case in the browser: the Gemini calls go straight from here to Google
// with the key kept in this browser, then only the results go to a save action.
// Tailor's server never receives the key.
export function useAiTask() {
  const key = useGeminiKey();
  const [state, setState] = useState<AiTaskState>({ running: false, step: 0 });

  async function run(task: Task, notice?: string): Promise<boolean> {
    if (!key) {
      setState({ running: false, step: 0, error: new MissingApiKeyError().message });
      return false;
    }
    setState({ running: true, step: 0 });
    try {
      const result = await task(new GeminiLlm(key, { onUsage: recordGeminiCall }), (step) =>
        setState((s) => ({ ...s, step })),
      );
      if (result?.error) {
        setState({ running: false, step: 0, error: result.error });
        return false;
      }
      setState({ running: false, step: 0, notice });
      return true;
    } catch (err) {
      setState({ running: false, step: 0, error: describeAiFailure(err, key) });
      return false;
    }
  }

  return { ...state, run };
}
