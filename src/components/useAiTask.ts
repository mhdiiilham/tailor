"use client";

import { useState } from "react";
import type { ActionState } from "@/app/actions";
import type { OnStep } from "@/application/workflows";
import { MissingApiKeyError } from "@/domain/errors";
import type { LlmPort } from "@/domain/ports";
import { describeAiFailure } from "@/infrastructure/llm/geminiErrors";
import { GeminiLlm } from "@/infrastructure/llm/geminiLlm";
import { OllamaLlm } from "@/infrastructure/llm/ollamaLlm";
import { useGeminiKey } from "./geminiKey";
import { readGeminiModels } from "./geminiModels";
import { recordGeminiCall } from "./geminiUsage";
import { readOllamaConfig } from "./ollamaConfig";

export type AiTaskState = { running: boolean; step: number; error?: string; notice?: string };

type Task = (llm: LlmPort, onStep: OnStep) => Promise<ActionState | void>;

// Runs one AI use case in the browser: the calls go straight from here to Google (with the
// key kept in this browser) or to Ollama on this machine, then only the results go to a
// save action. Tailor's server never receives the key.
export function useAiTask() {
  const key = useGeminiKey();
  const [state, setState] = useState<AiTaskState>({ running: false, step: 0 });

  async function run(task: Task, notice?: string): Promise<boolean> {
    const ollama = readOllamaConfig();
    if (!ollama.enabled && !key) {
      setState({ running: false, step: 0, error: new MissingApiKeyError().message });
      return false;
    }
    setState({ running: true, step: 0 });
    try {
      const llm = ollama.enabled
        ? new OllamaLlm(ollama)
        : new GeminiLlm(key ?? "",{ models: readGeminiModels(), onUsage: recordGeminiCall });
      const result = await task(llm, (step) => setState((s) => ({ ...s, step })));
      if (result?.error) {
        setState({ running: false, step: 0, error: result.error });
        return false;
      }
      setState({ running: false, step: 0, notice });
      return true;
    } catch (err) {
      setState({ running: false, step: 0, error: describeAiFailure(err, key ?? undefined) });
      return false;
    }
  }

  return { ...state, run };
}
