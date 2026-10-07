"use client";

import Link from "next/link";
import { useSyncExternalStore, type ReactNode } from "react";
import { clearKey, KEY_NAME, readKey, writeKey, type KeyStores } from "./keyStorage";
import { useOllamaConfig } from "./ollamaConfig";
import { EmptyState } from "./ui";

// The Gemini key lives only in this browser and is sent only to Google: the AI steps
// run here (see useAiTask), so Tailor's server never receives it. See ./keyStorage.
export const GEMINI_KEY_GUIDE = "https://ai.google.dev/gemini-api/docs/api-key";
const listeners = new Set<() => void>();

function stores(): KeyStores {
  const pick = (name: "localStorage" | "sessionStorage") => {
    try {
      return window[name];
    } catch {
      return null;
    }
  };
  return { local: pick("localStorage"), session: pick("sessionStorage") };
}

const notify = () => listeners.forEach((l) => l());

// remember: keep it on this device; otherwise only until the tab closes.
export function setGeminiKey(value: string, remember = true): void {
  if (value) writeKey(stores(), value, remember);
  else clearKey(stores());
  notify();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY_NAME) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

// null while rendering on the server (unknown), "" when no key is saved.
export function useGeminiKey(): string | null {
  return useSyncExternalStore(
    subscribe,
    () => readKey(stores()).key,
    () => null,
  );
}

// Whether the key is kept on this device (true) or only for this tab (false).
export function useKeyRemembered(): boolean | null {
  return useSyncExternalStore(
    subscribe,
    () => readKey(stores()).remembered,
    () => null,
  );
}

// Shows the form only when this browser has a key.
export function RequireGeminiKey({ children }: { children: ReactNode }) {
  const key = useGeminiKey();
  const ollama = useOllamaConfig();
  if (key === null || ollama === null) return <div className="h-40 animate-pulse rounded-ui bg-raised" aria-hidden />;
  if (!key && !ollama.enabled) {
    return (
      <EmptyState
        title="Add your Gemini API key first"
        actions={
          <>
            <Link href="/settings" className="text-accent">
              Go to Settings
            </Link>
            <a href={GEMINI_KEY_GUIDE} target="_blank" rel="noreferrer" className="text-muted hover:text-ink">
              How to get a key
            </a>
          </>
        }
      >
        Resumes are written with your own Gemini key. It stays in this browser and goes only to Google. Tailor’s server
        never receives it.
      </EmptyState>
    );
  }
  return children;
}
