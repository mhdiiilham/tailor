import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogle } from "@ai-sdk/google";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText, Output, type LanguageModel } from "ai";
import type { GenerateObjectRequest, LlmPort, ModelTier } from "@/domain/ports";
import type { LlmConfig } from "./config";

function buildModels(config: LlmConfig): Record<ModelTier, LanguageModel> {
  switch (config.provider) {
    case "anthropic": {
      const p = createAnthropic({ apiKey: config.apiKey });
      return { fast: p(config.fastModel), write: p(config.writeModel) };
    }
    case "google": {
      const p = createGoogle({ apiKey: config.apiKey });
      return { fast: p(config.fastModel), write: p(config.writeModel) };
    }
    case "openai-compatible": {
      const p = createOpenAICompatible({
        name: "compatible",
        baseURL: config.baseURL,
        apiKey: config.apiKey || undefined,
        supportsStructuredOutputs: true,
      });
      return { fast: p.chatModel(config.fastModel), write: p.chatModel(config.writeModel) };
    }
  }
}

export class AiSdkLlm implements LlmPort {
  private readonly models: Record<ModelTier, LanguageModel>;

  constructor(private readonly config: LlmConfig) {
    this.models = buildModels(config);
  }

  async generateObject<T>({ tier, schema, system, prompt }: GenerateObjectRequest<T>): Promise<T> {
    const started = Date.now();
    const result = await generateText({
      model: this.models[tier],
      output: Output.object({ schema }),
      system,
      prompt,
    });
    const model = tier === "fast" ? this.config.fastModel : this.config.writeModel;
    console.info(
      `[llm] ${model} tier=${tier} in=${result.usage.inputTokens ?? "?"} out=${result.usage.outputTokens ?? "?"} ${Date.now() - started}ms`,
    );
    return result.output as T;
  }
}
