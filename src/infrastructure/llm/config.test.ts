import { describe, expect, it } from "vitest";
import { loadLlmConfig } from "./config";

describe("loadLlmConfig", () => {
  it("defaults to Anthropic with Haiku for fast and Sonnet for writing", () => {
    expect(loadLlmConfig({ ANTHROPIC_API_KEY: "k" })).toEqual({
      provider: "anthropic",
      apiKey: "k",
      fastModel: "claude-haiku-4-5",
      writeModel: "claude-sonnet-5-5",
    });
  });

  it("supports an OpenAI-compatible endpoint such as Qwen", () => {
    const config = loadLlmConfig({
      LLM_PROVIDER: "openai-compatible",
      LLM_BASE_URL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
      LLM_API_KEY: "k",
      LLM_MODEL_FAST: "qwen-flash",
      LLM_MODEL_WRITE: "qwen-plus",
    });
    expect(config).toMatchObject({ provider: "openai-compatible", writeModel: "qwen-plus" });
  });

  it("explains what is missing", () => {
    expect(() => loadLlmConfig({ LLM_PROVIDER: "anthropic" })).toThrow(/ANTHROPIC_API_KEY/);
    expect(() => loadLlmConfig({ LLM_PROVIDER: "google", GOOGLE_GENERATIVE_AI_API_KEY: "k" })).toThrow(
      /LLM_MODEL_FAST/,
    );
  });
});
