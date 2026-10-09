import { createGoogle } from "@ai-sdk/google";
import { generateText, Output, type LanguageModel } from "ai";
import type { GenerateObjectRequest, LlmPort, ModelTier } from "@/domain/ports";
import type { GeminiCall } from "@/domain/usage";
import { classifyGeminiError } from "./geminiErrors";

export type GeminiModels = Record<ModelTier, string>;

export const DEFAULT_GEMINI_MODELS: GeminiModels = {
  fast: "gemini-flash-lite-latest",
  write: "gemini-flash-latest",
};

// Runs in the browser with the user's own key, which goes straight to Google.
export class GeminiLlm implements LlmPort {
  private readonly models: Record<ModelTier, LanguageModel>;

  private readonly modelIds: GeminiModels;
  private readonly onUsage: (call: GeminiCall) => void;

  // onUsage hears about every successful call, so the browser can keep a usage count.
  constructor(
    apiKey: string,
    {
      models = DEFAULT_GEMINI_MODELS,
      onUsage = () => {},
    }: { models?: GeminiModels; onUsage?: (call: GeminiCall) => void } = {},
  ) {
    this.modelIds = models;
    this.onUsage = onUsage;
    const google = createGoogle({ apiKey });
    this.models = { fast: google(models.fast), write: google(models.write) };
  }

  async generateObject<T>({ tier, schema, system, prompt, temperature }: GenerateObjectRequest<T>): Promise<T> {
    const started = Date.now();
    try {
      const result = await generateText({
        model: this.models[tier],
        output: Output.object({ schema }),
        system,
        prompt,
        temperature,
        // Free-tier keys hit per-minute limits; the SDK backs off and honours retry-after.
        maxRetries: 4,
      });
      this.report(tier, result.usage);
      console.debug(
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
      const result = await generateText({
        model: this.models.fast,
        prompt: "Reply with OK.",
        maxOutputTokens: 5,
        maxRetries: 1,
      });
      this.report("fast", result.usage);
    } catch (err) {
      throw classifyGeminiError(err);
    }
  }

  private report(tier: ModelTier, usage: { inputTokens: number | undefined; outputTokens: number | undefined }) {
    this.onUsage({
      model: this.modelIds[tier],
      inputTokens: usage.inputTokens ?? 0,
      outputTokens: usage.outputTokens ?? 0,
    });
  }
}
