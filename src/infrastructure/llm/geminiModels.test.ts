import { describe, expect, it } from "vitest";
import { DEFAULT_GEMINI_MODELS } from "./geminiLlm";
import { modelOptions, parseModelList, resolveModels } from "./geminiModels";

describe("parseModelList", () => {
  it("keeps Gemini models that can generate content, without the models/ prefix", () => {
    const list = parseModelList({
      models: [
        {
          name: "models/gemini-2.5-flash",
          displayName: "Gemini 2.5 Flash",
          supportedGenerationMethods: ["generateContent", "countTokens"],
        },
        { name: "models/text-embedding-004", displayName: "Embedding", supportedGenerationMethods: ["embedContent"] },
        {
          name: "models/gemini-flash-latest",
          displayName: "Gemini Flash Latest",
          supportedGenerationMethods: ["generateContent"],
        },
        { name: "models/imagen-4", displayName: "Imagen", supportedGenerationMethods: ["predict"] },
      ],
    });
    expect(list).toEqual([
      { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
      { id: "gemini-flash-latest", label: "Gemini Flash Latest" },
    ]);
  });

  it("returns nothing for an unexpected response", () => {
    expect(parseModelList({ error: "nope" })).toEqual([]);
    expect(parseModelList(null)).toEqual([]);
  });
});

describe("resolveModels", () => {
  it("defaults to the current models", () => {
    expect(resolveModels(null)).toEqual(DEFAULT_GEMINI_MODELS);
  });

  it("uses a saved choice per tier and falls back for anything missing or malformed", () => {
    expect(resolveModels('{"fast":"gemini-2.5-flash-lite"}')).toEqual({
      ...DEFAULT_GEMINI_MODELS,
      fast: "gemini-2.5-flash-lite",
    });
    expect(resolveModels('{"fast":"../../evil","write":42}')).toEqual(DEFAULT_GEMINI_MODELS);
    expect(resolveModels("not json")).toEqual(DEFAULT_GEMINI_MODELS);
  });
});

describe("modelOptions", () => {
  it("always offers the default and the current choice, even if Google's list misses them", () => {
    const ids = modelOptions(
      [{ id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" }],
      "gemini-flash-latest",
      "gemini-old-pick",
    ).map((o) => o.id);
    expect(ids).toEqual(["gemini-flash-latest", "gemini-old-pick", "gemini-2.5-pro"]);
  });
});
