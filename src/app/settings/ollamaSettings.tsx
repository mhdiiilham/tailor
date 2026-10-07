"use client";

import { Broadcast, Desktop } from "@phosphor-icons/react";
import { useEffect, useState, useTransition } from "react";
import type { ActionState } from "@/app/actions";
import { listOllamaModels, saveOllamaConfig, useOllamaConfig } from "@/components/ollamaConfig";
import { Button, Card, FormMessage, SectionHeader, Skeleton } from "@/components/ui";
import type { ModelTier } from "@/domain/ports";
import { describeAiFailure } from "@/infrastructure/llm/geminiErrors";
import { DEFAULT_OLLAMA_CONFIG } from "@/infrastructure/llm/ollamaConfig";
import { OllamaLlm } from "@/infrastructure/llm/ollamaLlm";

const TIERS: { tier: ModelTier; label: string }[] = [
  { tier: "fast", label: "Fast model (reads the job, scores your fit)" },
  { tier: "write", label: "Writing model (resume and cover letter)" },
];

// Optional: run the AI steps on Ollama on this computer instead of Gemini. The browser
// talks to localhost directly, so nothing leaves this machine and no key is needed.
export function OllamaSettings() {
  const config = useOllamaConfig();
  const [installed, setInstalled] = useState<string[] | null>(null);
  const [state, setState] = useState<ActionState>({});
  const [testing, startTesting] = useTransition();
  const baseUrl = config?.baseUrl;

  useEffect(() => {
    if (!config?.enabled || !baseUrl) return;
    let cancelled = false;
    listOllamaModels(baseUrl).then(
      (names) => !cancelled && setInstalled(names),
      () => !cancelled && setInstalled([]),
    );
    return () => {
      cancelled = true;
    };
  }, [config?.enabled, baseUrl]);

  function testConnection() {
    if (!config) return;
    startTesting(async () => {
      try {
        await new OllamaLlm(config).ping();
        setState({ notice: "Ollama works." });
      } catch (err) {
        setState({ error: describeAiFailure(err) });
      }
    });
  }

  return (
    <Card>
      <SectionHeader
        icon={<Desktop size={18} />}
        title="Local model (Ollama)"
        description="Use a model running on this computer instead of Gemini. Free and private, but slower and less accurate."
      />
      {config === null ? (
        <Skeleton className="h-24" />
      ) : (
        <div className="grid gap-5 border-t border-line pt-5 sm:pl-12">
          <label className="flex cursor-pointer items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => saveOllamaConfig({ ...config, enabled: e.target.checked })}
              className="mt-0.5 size-4 shrink-0 cursor-pointer accent-[var(--accent)]"
            />
            <span className="grid gap-0.5">
              <span className="font-medium">Use Ollama instead of Gemini</span>
              <span className="text-faint">
                Start Ollama with <code className="font-mono">OLLAMA_ORIGINS={"<this site's address>"}</code> so the
                browser is allowed to call it. Models of about 7B or larger work best.
              </span>
            </span>
          </label>

          {config.enabled ? (
            <>
              {TIERS.map(({ tier, label }) => (
                <div key={tier} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:items-center sm:gap-6">
                  <label htmlFor={`ollama-${tier}`} className="text-sm font-medium">
                    {label}
                  </label>
                  <input
                    id={`ollama-${tier}`}
                    list="ollama-models"
                    value={config.models[tier]}
                    onChange={(e) =>
                      saveOllamaConfig({ ...config, models: { ...config.models, [tier]: e.target.value.trim() } })
                    }
                    placeholder={DEFAULT_OLLAMA_CONFIG.models[tier]}
                    className="h-10 w-full rounded-ui border border-line bg-sunken px-3 font-mono text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
                  />
                </div>
              ))}
              <datalist id="ollama-models">
                {(installed ?? []).map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
              <p className="text-sm text-faint">
                {installed === null
                  ? "Looking for models on this computer..."
                  : installed.length
                    ? "Suggestions come from the models you have pulled."
                    : `Couldn't list models at ${config.baseUrl}. Is Ollama running?`}
              </p>
              <FormMessage {...state} />
              <div className="flex flex-wrap gap-3 border-t border-line pt-5">
                <Button type="button" variant="secondary" onClick={testConnection} disabled={testing}>
                  <Broadcast size={16} />
                  {testing ? "Testing..." : "Test connection"}
                </Button>
              </div>
            </>
          ) : null}
        </div>
      )}
    </Card>
  );
}
