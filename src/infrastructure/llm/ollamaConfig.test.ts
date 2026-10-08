import { describe, expect, it } from "vitest";
import { DEFAULT_OLLAMA_CONFIG, RECOMMENDED_MODELS, resolveOllamaConfig } from "./ollamaConfig";

describe("resolveOllamaConfig", () => {
  it("is off with the defaults when nothing is saved", () => {
    expect(resolveOllamaConfig(null)).toEqual(DEFAULT_OLLAMA_CONFIG);
    expect(DEFAULT_OLLAMA_CONFIG.enabled).toBe(false);
  });

  it("reads a saved choice", () => {
    const saved = JSON.stringify({
      enabled: true,
      baseUrl: "http://127.0.0.1:11500/",
      models: { fast: "qwen2.5:7b", write: "gemma3:12b" },
    });
    expect(resolveOllamaConfig(saved)).toEqual({
      enabled: true,
      baseUrl: "http://127.0.0.1:11500",
      models: { fast: "qwen2.5:7b", write: "gemma3:12b" },
    });
  });

  it("falls back to the defaults for broken JSON", () => {
    expect(resolveOllamaConfig("{nope")).toEqual(DEFAULT_OLLAMA_CONFIG);
  });

  it("only accepts a local address, so a tampered setting can't send data elsewhere", () => {
    for (const baseUrl of ["https://evil.example.com", "http://192.168.1.5:11434", "http://localhost.evil.com", "nope"]) {
      expect(resolveOllamaConfig(JSON.stringify({ enabled: true, baseUrl })).baseUrl).toBe(DEFAULT_OLLAMA_CONFIG.baseUrl);
    }
  });

  it("ignores model names with strange characters", () => {
    const saved = JSON.stringify({ enabled: true, models: { fast: "../etc passwd", write: "qwen3:8b" } });
    expect(resolveOllamaConfig(saved).models).toEqual({ fast: DEFAULT_OLLAMA_CONFIG.models.fast, write: "qwen3:8b" });
  });

  it("treats anything but true as off", () => {
    expect(resolveOllamaConfig(JSON.stringify({ enabled: "yes" })).enabled).toBe(false);
  });
});

describe("RECOMMENDED_MODELS", () => {
  it("are all accepted as model names", () => {
    for (const { name } of RECOMMENDED_MODELS) {
      const saved = JSON.stringify({ models: { fast: name, write: name } });
      expect(resolveOllamaConfig(saved).models).toEqual({ fast: name, write: name });
    }
  });
});
