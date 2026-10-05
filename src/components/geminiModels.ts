"use client";

import { useSyncExternalStore } from "react";
import type { ModelTier } from "@/domain/ports";
import { DEFAULT_GEMINI_MODELS, type GeminiModels } from "@/infrastructure/llm/geminiLlm";
import { parseModelList, resolveModels, type ModelOption } from "@/infrastructure/llm/geminiModels";

// The person's model choice per tier, kept in this browser next to their key.
const MODELS_KEY = "tailor.llmModels";
const listeners = new Set<() => void>();

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readRaw(): string | null {
  try {
    return storage()?.getItem(MODELS_KEY) ?? null;
  } catch {
    return null;
  }
}

function write(models: Partial<GeminiModels>): void {
  try {
    if (Object.keys(models).length) storage()?.setItem(MODELS_KEY, JSON.stringify(models));
    else storage()?.removeItem(MODELS_KEY);
  } catch {
    // Storage blocked: the defaults are used.
  }
  listeners.forEach((l) => l());
}

// Picking the default again just forgets the choice, so a future default applies.
export function setGeminiModel(tier: ModelTier, id: string): void {
  const current = resolveModels(readRaw());
  const next: Partial<GeminiModels> = {};
  for (const t of ["fast", "write"] as const) {
    const value = t === tier ? id : current[t];
    if (value !== DEFAULT_GEMINI_MODELS[t]) next[t] = value;
  }
  write(next);
}

export const resetGeminiModels = () => write({});

// For code that runs a Gemini call right now (not a render).
export const readGeminiModels = (): GeminiModels => resolveModels(readRaw());

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === MODELS_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

let cached: { raw: string | null; models: GeminiModels } = { raw: null, models: DEFAULT_GEMINI_MODELS };
function snapshot(): GeminiModels {
  const raw = readRaw();
  if (raw !== cached.raw) cached = { raw, models: resolveModels(raw) };
  return cached.models;
}

// null while rendering on the server.
export function useGeminiModels(): GeminiModels | null {
  return useSyncExternalStore(subscribe, snapshot, () => null);
}

// The models this key can use, straight from Google (this browser to Google, like every Gemini call).
export async function listGeminiModels(key: string): Promise<ModelOption[]> {
  const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000", {
    headers: { "x-goog-api-key": key },
  });
  if (!res.ok) throw new Error(`Google returned ${res.status}`);
  return parseModelList(await res.json());
}
