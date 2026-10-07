import { z } from "zod";
import type { ModelTier } from "@/domain/ports";

// Local Ollama as an alternative to Gemini: the person's choice, kept in their browser.

export type OllamaConfig = {
  enabled: boolean;
  baseUrl: string;
  models: Record<ModelTier, string>;
};

export const DEFAULT_OLLAMA_CONFIG: OllamaConfig = {
  enabled: false,
  baseUrl: "http://localhost:11434",
  models: { fast: "qwen2.5:7b", write: "qwen2.5:7b" },
};

// Names like "qwen2.5:7b" or "hf.co/user/model:Q4_K_M". Anything else is ignored.
const ModelName = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._:/-]{0,100}$/);

// Only this machine: the page's Content Security Policy allows nothing else, and a
// tampered setting must not turn into a request to someone else's server.
export function parseLocalBaseUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    return url.protocol === "http:" && local ? url.origin : null;
  } catch {
    return null;
  }
}

export function resolveOllamaConfig(saved: string | null): OllamaConfig {
  let raw: Record<string, unknown> = {};
  try {
    const parsed: unknown = saved ? JSON.parse(saved) : null;
    if (parsed && typeof parsed === "object") raw = parsed as Record<string, unknown>;
  } catch {
    // Unreadable: use the defaults.
  }
  const models = (raw.models ?? {}) as Record<string, unknown>;
  const pick = (tier: ModelTier) =>
    ModelName.safeParse(models[tier]).success ? (models[tier] as string) : DEFAULT_OLLAMA_CONFIG.models[tier];
  return {
    enabled: raw.enabled === true,
    baseUrl: parseLocalBaseUrl(raw.baseUrl) ?? DEFAULT_OLLAMA_CONFIG.baseUrl,
    models: { fast: pick("fast"), write: pick("write") },
  };
}
