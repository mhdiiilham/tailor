import { z } from "zod";
import { OllamaModelMissingError, OllamaUnreachableError } from "@/domain/errors";
import type { GenerateObjectRequest, LlmPort, ModelTier } from "@/domain/ports";
import type { OllamaConfig } from "./ollamaConfig";

// Ollama's default window is small and silently cuts long prompts, so ask for more room.
const CONTEXT_TOKENS = 16384;

// Runs in the browser against Ollama on the person's own machine. No key, no usage count.
export class OllamaLlm implements LlmPort {
  constructor(
    private readonly config: Pick<OllamaConfig, "baseUrl" | "models">,
    private readonly fetchImpl: typeof fetch = (...args) => fetch(...args),
  ) {}

  async generateObject<T>({ tier, schema, system, prompt }: GenerateObjectRequest<T>): Promise<T> {
    const format = z.toJSONSchema(schema);
    const messages = [
      { role: "system", content: system },
      { role: "user", content: prompt },
    ];
    // Small models sometimes break the format; one more try is usually enough.
    for (let attempt = 0; attempt < 2; attempt++) {
      const parsed = schema.safeParse(parseJson(await this.chat(tier, messages, format)));
      if (parsed.success) return parsed.data;
    }
    throw new Error("The local model didn't give a valid answer. Try a larger model in Settings.");
  }

  // One tiny call to check Ollama is reachable and has the model.
  async ping(): Promise<void> {
    await this.chat("fast", [{ role: "user", content: "Reply with OK." }]);
  }

  private async chat(tier: ModelTier, messages: unknown[], format?: unknown): Promise<string> {
    const model = this.config.models[tier];
    let res: Response;
    try {
      res = await this.fetchImpl(`${this.config.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages,
          stream: false,
          ...(format ? { format } : {}),
          options: { num_ctx: CONTEXT_TOKENS, temperature: 0 },
        }),
      });
    } catch {
      throw new OllamaUnreachableError();
    }
    if (res.status === 404) throw new OllamaModelMissingError(model);
    if (!res.ok) throw new Error(`Ollama returned ${res.status}.`);
    const body = (await res.json()) as { message?: { content?: string } };
    return body.message?.content ?? "";
  }
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}
