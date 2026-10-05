"use client";

import type { ActionState } from "@/app/actions";
import { describeAiFailure } from "@/infrastructure/llm/geminiErrors";
import { GeminiLlm } from "@/infrastructure/llm/geminiLlm";
import { readGeminiModels } from "./geminiModels";
import { recordGeminiCall } from "./geminiUsage";

// One tiny call from this browser straight to Google. Tailor's server isn't involved.
export async function checkGeminiKey(key: string): Promise<ActionState> {
  try {
    await new GeminiLlm(key, { models: readGeminiModels(), onUsage: recordGeminiCall }).ping();
    return { notice: "Key works." };
  } catch (err) {
    return { error: describeAiFailure(err, key) };
  }
}
