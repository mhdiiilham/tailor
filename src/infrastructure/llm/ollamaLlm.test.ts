import { describe, expect, it } from "vitest";
import { z } from "zod";
import { OllamaModelMissingError, OllamaUnreachableError } from "@/domain/errors";
import { DEFAULT_OLLAMA_CONFIG } from "./ollamaConfig";
import { OllamaLlm } from "./ollamaLlm";

const schema = z.object({ title: z.string() });
const request = { tier: "write" as const, schema, system: "Be brief.", prompt: "Name the role." };
const config = { baseUrl: DEFAULT_OLLAMA_CONFIG.baseUrl, models: { fast: "small:1b", write: "big:7b" } };

function reply(content: string, status = 200): Response {
  return new Response(JSON.stringify({ message: { content } }), { status });
}

function fakeFetch(...responses: (Response | Error)[]) {
  const calls: { url: string; body: Record<string, unknown> }[] = [];
  const impl = async (url: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(url), body: JSON.parse(String(init?.body)) });
    const next = responses.shift();
    if (!next) throw new Error("no response queued");
    if (next instanceof Error) throw next;
    return next;
  };
  return { impl: impl as typeof fetch, calls };
}

describe("OllamaLlm", () => {
  it("asks the tier's model for JSON that matches the schema and returns it parsed", async () => {
    const { impl, calls } = fakeFetch(reply('{"title":"Staff Engineer"}'));
    const result = await new OllamaLlm(config, impl).generateObject(request);

    expect(result).toEqual({ title: "Staff Engineer" });
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe("http://localhost:11434/api/chat");
    expect(calls[0].body).toMatchObject({
      model: "big:7b",
      stream: false,
      format: z.toJSONSchema(schema),
      messages: [
        { role: "system", content: "Be brief." },
        { role: "user", content: "Name the role." },
      ],
    });
    expect((calls[0].body.options as { num_ctx: number }).num_ctx).toBeGreaterThanOrEqual(8192);
  });

  it("uses the fast model for the fast tier", async () => {
    const { impl, calls } = fakeFetch(reply('{"title":"x"}'));
    await new OllamaLlm(config, impl).generateObject({ ...request, tier: "fast" });
    expect(calls[0].body.model).toBe("small:1b");
  });

  it("tries once more when the answer doesn't match the schema", async () => {
    const { impl, calls } = fakeFetch(reply("not json"), reply('{"title":"Second try"}'));
    const result = await new OllamaLlm(config, impl).generateObject(request);
    expect(result).toEqual({ title: "Second try" });
    expect(calls).toHaveLength(2);
  });

  it("gives up after the second bad answer", async () => {
    const { impl } = fakeFetch(reply('{"wrong":1}'), reply('{"wrong":2}'));
    await expect(new OllamaLlm(config, impl).generateObject(request)).rejects.toThrow(/valid answer/);
  });

  it("explains when Ollama can't be reached", async () => {
    const { impl } = fakeFetch(new TypeError("Failed to fetch"));
    await expect(new OllamaLlm(config, impl).generateObject(request)).rejects.toBeInstanceOf(OllamaUnreachableError);
  });

  it("says which model to pull when Ollama doesn't have it", async () => {
    const { impl } = fakeFetch(new Response('{"error":"model not found"}', { status: 404 }));
    await expect(new OllamaLlm(config, impl).generateObject(request)).rejects.toThrow(
      new OllamaModelMissingError("big:7b"),
    );
  });

  it("ping checks the fast model answers", async () => {
    const { impl, calls } = fakeFetch(reply("OK"));
    await new OllamaLlm(config, impl).ping();
    expect(calls[0].body.model).toBe("small:1b");
  });
});
