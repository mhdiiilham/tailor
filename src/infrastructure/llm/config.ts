import { z } from "zod";

const required = (name: string) =>
  z.string({ error: `${name} is required` }).min(1, `${name} is required`);

const ConfigSchema = z.discriminatedUnion("provider", [
  z.object({
    provider: z.literal("anthropic"),
    apiKey: required("ANTHROPIC_API_KEY"),
    fastModel: z.string().default("claude-haiku-4-5"),
    writeModel: z.string().default("claude-sonnet-5-5"),
  }),
  z.object({
    provider: z.literal("google"),
    apiKey: required("GOOGLE_GENERATIVE_AI_API_KEY"),
    fastModel: required("LLM_MODEL_FAST"),
    writeModel: required("LLM_MODEL_WRITE"),
  }),
  // Qwen (Alibaba Model Studio), DeepSeek, OpenRouter, Ollama and anything else
  // that speaks the OpenAI chat API.
  z.object({
    provider: z.literal("openai-compatible"),
    baseURL: z.url({ error: "LLM_BASE_URL must be a URL" }),
    apiKey: z.string().default(""),
    fastModel: required("LLM_MODEL_FAST"),
    writeModel: required("LLM_MODEL_WRITE"),
  }),
]);

export type LlmConfig = z.infer<typeof ConfigSchema>;

const blankToUndefined = (v: string | undefined) => (v && v.trim() ? v.trim() : undefined);

export function loadLlmConfig(env: Record<string, string | undefined>): LlmConfig {
  const provider = env.LLM_PROVIDER ?? "anthropic";
  const apiKey = {
    anthropic: env.ANTHROPIC_API_KEY,
    google: env.GOOGLE_GENERATIVE_AI_API_KEY,
    "openai-compatible": env.LLM_API_KEY,
  }[provider];
  return ConfigSchema.parse({
    provider,
    apiKey: apiKey ?? "",
    baseURL: env.LLM_BASE_URL,
    fastModel: blankToUndefined(env.LLM_MODEL_FAST),
    writeModel: blankToUndefined(env.LLM_MODEL_WRITE),
  });
}
