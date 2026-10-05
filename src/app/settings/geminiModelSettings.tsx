"use client";

import { Cpu } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { useGeminiKey } from "@/components/geminiKey";
import { listGeminiModels, resetGeminiModels, setGeminiModel, useGeminiModels } from "@/components/geminiModels";
import { Card, SectionHeader, Skeleton } from "@/components/ui";
import type { ModelTier } from "@/domain/ports";
import { DEFAULT_GEMINI_MODELS } from "@/infrastructure/llm/geminiLlm";
import { modelOptions, type ModelOption } from "@/infrastructure/llm/geminiModels";

const TIERS: { tier: ModelTier; label: string; detail: string }[] = [
  {
    tier: "fast",
    label: "Fast model",
    detail: "Reads the job description, scores your fit and writes the questions. Three calls per application.",
  },
  {
    tier: "write",
    label: "Writing model",
    detail: "Writes and revises the resume and the cover letter.",
  },
];

// Which Gemini model each step uses. The list comes from Google for this key; the
// choice is kept in this browser and used by every AI call from here.
export function GeminiModelSettings() {
  const key = useGeminiKey();
  const models = useGeminiModels();
  const [available, setAvailable] = useState<ModelOption[] | null>(null);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    listGeminiModels(key).then(
      (list) => !cancelled && setAvailable(list),
      () => !cancelled && setError("Couldn't load the model list from Google. The defaults still work."),
    );
    return () => {
      cancelled = true;
    };
  }, [key]);

  const customized =
    models && (models.fast !== DEFAULT_GEMINI_MODELS.fast || models.write !== DEFAULT_GEMINI_MODELS.write);

  return (
    <Card>
      <SectionHeader
        icon={<Cpu size={18} />}
        title="Models"
        description="Which Gemini model Tailor uses for each step. Saved in this browser, like your key."
        aside={
          customized ? (
            <button type="button" onClick={resetGeminiModels} className="text-sm text-accent hover:underline">
              Reset to defaults
            </button>
          ) : null
        }
      />
      {models === null ? (
        <Skeleton className="h-32" />
      ) : (
        <div className="grid gap-5 border-t border-line pt-5">
          {TIERS.map(({ tier, label, detail }) => (
            <div key={tier} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:items-center sm:gap-6">
              <label htmlFor={`model-${tier}`} className="grid gap-0.5">
                <span className="text-sm font-medium">{label}</span>
                <span className="text-sm text-muted">{detail}</span>
              </label>
              <select
                id={`model-${tier}`}
                value={models[tier]}
                onChange={(e) => setGeminiModel(tier, e.target.value)}
                className="h-10 w-full rounded-ui border border-line bg-sunken px-3 font-mono text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
              >
                {modelOptions(available ?? [], DEFAULT_GEMINI_MODELS[tier], models[tier]).map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.id}
                    {o.id === DEFAULT_GEMINI_MODELS[tier] ? " (default)" : ""}
                  </option>
                ))}
              </select>
            </div>
          ))}
          <p className="text-sm text-faint">
            {!key
              ? "Add your key above to choose from every model it can use."
              : error
                ? error
                : available === null
                  ? "Loading the models your key can use..."
                  : "Pro models usually write better but are slower and have lower free-tier limits. Lite models are the fastest."}
          </p>
        </div>
      )}
    </Card>
  );
}
