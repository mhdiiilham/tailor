import { createGoogle } from "@ai-sdk/google";
import { generateText, Output, type LanguageModel } from "ai";
import type { GenerateObjectRequest, LlmPort, ModelTier } from "@/domain/ports";
import { classifyGeminiError } from "./geminiErrors";

export type GeminiModels = Record<ModelTier, string>;

export function geminiModelsFromEnv(env: Record<string, string | undefined>): GeminiModels {
  return {
    fast: env.GEMINI_MODEL_FAST?.trim() || "gemini-flash-lite-latest",
    write: env.GEMINI_MODEL_WRITE?.trim() || "gemini-flash-latest",
  };
}

// Built per request with the caller's own key, which is never stored or logged.
export class GeminiLlm implements LlmPort {
  private readonly models: Record<ModelTier, LanguageModel>;

  constructor(
    apiKey: string,
    private readonly modelIds: GeminiModels,
  ) {
    const google = createGoogle({ apiKey });
    this.models = { fast: google(modelIds.fast), write: google(modelIds.write) };
  }

  async generateObject<T>({ tier, schema, system, prompt }: GenerateObjectRequest<T>): Promise<T> {
    const started = Date.now();
    try {
      const result = await generateText({
        model: this.models[tier],
        output: Output.object({ schema }),
        system,
        prompt,
        // Free-tier keys hit per-minute limits; the SDK backs off and honours retry-after.
        maxRetries: 4,
      });
      console.info(
        `[llm] ${this.modelIds[tier]} tier=${tier} in=${result.usage.inputTokens ?? "?"} out=${result.usage.outputTokens ?? "?"} ${Date.now() - started}ms`,
      );
      return result.output as T;
    } catch (err) {
      throw classifyGeminiError(err);
    }
  }

  // One tiny call to check the key works.
  async ping(): Promise<void> {
    try {
      await generateText({ model: this.models.fast, prompt: "Reply with OK.", maxOutputTokens: 5, maxRetries: 1 });
    } catch (err) {
      throw classifyGeminiError(err);
    }
  }
}
