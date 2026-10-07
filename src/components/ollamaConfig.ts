"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_OLLAMA_CONFIG, resolveOllamaConfig, type OllamaConfig } from "@/infrastructure/llm/ollamaConfig";

// Whether to use local Ollama instead of Gemini, kept in this browser.
const CONFIG_KEY = "tailor.ollama";
const listeners = new Set<() => void>();

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(CONFIG_KEY);
  } catch {
    return null;
  }
}

export function saveOllamaConfig(config: OllamaConfig): void {
  try {
    window.localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch {
    // Storage blocked: Gemini stays in use.
  }
  listeners.forEach((l) => l());
}

// For code that runs a call right now (not a render).
export const readOllamaConfig = (): OllamaConfig => resolveOllamaConfig(readRaw());

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === CONFIG_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

let cached: { raw: string | null; config: OllamaConfig } = { raw: null, config: DEFAULT_OLLAMA_CONFIG };
function snapshot(): OllamaConfig {
  const raw = readRaw();
  if (raw !== cached.raw) cached = { raw, config: resolveOllamaConfig(raw) };
  return cached.config;
}

// null while rendering on the server.
export function useOllamaConfig(): OllamaConfig | null {
  return useSyncExternalStore(subscribe, snapshot, () => null);
}

// The models Ollama has pulled, straight from this machine.
export async function listOllamaModels(baseUrl: string): Promise<string[]> {
  const res = await fetch(`${baseUrl}/api/tags`);
  if (!res.ok) throw new Error(`Ollama returned ${res.status}`);
  const json = (await res.json()) as { models?: { name?: string }[] };
  return (json.models ?? []).flatMap((m) => (m.name ? [m.name] : []));
}
