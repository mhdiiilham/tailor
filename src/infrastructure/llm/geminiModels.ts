import { z } from "zod";
import type { ModelTier } from "@/domain/ports";
import { DEFAULT_GEMINI_MODELS, type GeminiModels } from "./geminiLlm";

// Which Gemini model each tier uses: the person's own choice from Settings, kept in
// their browser, or the defaults. "fast" is LLM_MODEL_FAST, "write" is LLM_MODEL_WRITE.

export type ModelOption = { id: string; label: string };

// Model ids look like "gemini-2.5-flash" or "gemini-flash-latest". Anything else is
// ignored, so a tampered setting can't turn into a strange request URL.
const ModelId = z.string().regex(/^[a-z0-9][a-z0-9.\-]{1,80}$/);

const ListResponse = z.object({
  models: z.array(
    z.object({
      name: z.string(),
      displayName: z.string().optional(),
      supportedGenerationMethods: z.array(z.string()).optional(),
    }),
  ),
});

// Google's model list, narrowed to Gemini models that can generate content.
export function parseModelList(json: unknown): ModelOption[] {
  const parsed = ListResponse.safeParse(json);
  if (!parsed.success) return [];
  return parsed.data.models
    .filter((m) => m.name.startsWith("models/gemini") && m.supportedGenerationMethods?.includes("generateContent"))
    .map((m) => {
      const id = m.name.slice("models/".length);
      return { id, label: m.displayName || id };
    })
    .filter((m) => ModelId.safeParse(m.id).success);
}

export function resolveModels(saved: string | null): GeminiModels {
  let raw: unknown = null;
  try {
    raw = saved ? JSON.parse(saved) : null;
  } catch {
    raw = null;
  }
  const pick = (tier: ModelTier) => {
    const value = (raw as Record<string, unknown> | null)?.[tier];
    return ModelId.safeParse(value).success ? (value as string) : DEFAULT_GEMINI_MODELS[tier];
  };
  return { fast: pick("fast"), write: pick("write") };
}

// The choices for one tier: the default and the current pick first, then Google's list.
export function modelOptions(available: ModelOption[], defaultId: string, current: string): ModelOption[] {
  const first = [...new Set([defaultId, current])].map((id) => available.find((m) => m.id === id) ?? { id, label: id });
  return [...first, ...available.filter((m) => !first.some((f) => f.id === m.id))];
}
