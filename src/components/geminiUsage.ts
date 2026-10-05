"use client";

import { useSyncExternalStore } from "react";
import { parseUsageLog, recordUsage, type GeminiCall, type UsageLog } from "@/domain/usage";

// Tailor's own count of Gemini calls, kept in this browser (see domain/usage).
const USAGE_KEY = "tailor.geminiUsage";
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
    return storage()?.getItem(USAGE_KEY) ?? null;
  } catch {
    return null;
  }
}

export function recordGeminiCall(call: GeminiCall): void {
  try {
    const next = recordUsage(parseUsageLog(readRaw()), call, new Date());
    storage()?.setItem(USAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage blocked or full: the count just isn't kept.
  }
  listeners.forEach((l) => l());
}

// On sign-out, so the next person on a shared computer doesn't see it.
export function clearGeminiUsage(): void {
  try {
    storage()?.removeItem(USAGE_KEY);
  } catch {
    // Nothing stored, or storage blocked.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === USAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

// Parsed once per change of the stored text, so React sees a stable snapshot.
let cached: { raw: string | null; log: UsageLog } = { raw: null, log: {} };
function snapshot(): UsageLog {
  const raw = readRaw();
  if (raw !== cached.raw) cached = { raw, log: parseUsageLog(raw) };
  return cached.log;
}

// null while rendering on the server.
export function useGeminiUsage(): UsageLog | null {
  return useSyncExternalStore(subscribe, snapshot, () => null);
}

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
// 48213 -> "48.2K"
export const formatCount = (n: number) => compact.format(n);
