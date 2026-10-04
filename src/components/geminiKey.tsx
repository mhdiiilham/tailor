"use client";

import Link from "next/link";
import { useSyncExternalStore, type ReactNode } from "react";
import { EmptyState } from "./ui";

// The Gemini key lives only in this browser. It's sent with each AI request
// and never stored on the server.
export const GEMINI_KEY_GUIDE = "https://ai.google.dev/gemini-api/docs/api-key";
const STORAGE_KEY = "tailor.geminiKey";
const listeners = new Set<() => void>();

function read(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setGeminiKey(value: string): void {
  try {
    if (value) localStorage.setItem(STORAGE_KEY, value);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage blocked (private mode); the key just won't persist.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

// null while rendering on the server (unknown), "" when no key is saved.
export function useGeminiKey(): string | null {
  return useSyncExternalStore(subscribe, read, () => null);
}

export function GeminiKeyInput() {
  const key = useGeminiKey();
  return <input type="hidden" name="geminiKey" value={key ?? ""} />;
}

// Shows the form only when this browser has a key.
export function RequireGeminiKey({ children }: { children: ReactNode }) {
  const key = useGeminiKey();
  if (key === null) return <div className="h-40 animate-pulse rounded-ui bg-raised" aria-hidden />;
  if (!key) {
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
        Resumes are written with your own Gemini key. It stays in this browser and is only sent to run your requests.
      </EmptyState>
    );
  }
  return children;
}
