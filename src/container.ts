import "server-only";
import { ApplicationService } from "@/application/applications";
import { ApplicationRecords } from "@/application/records";
import { HnSync } from "@/application/hnSync";
import { DrizzleHnRepository } from "@/infrastructure/db/hnRepository";
import { getDb } from "@/infrastructure/db/instance";
import { HnApiClient } from "@/infrastructure/hn/hnApiClient";
import { GeminiLlm } from "@/infrastructure/llm/geminiLlm";
import {
  DrizzleAccountRepository,
  DrizzleApplicationRepository,
  DrizzleProfileRepository,
} from "@/infrastructure/db/repositories";
import { TypstResumeRenderer } from "@/infrastructure/typst/typstRenderer";

export const profileRepository = () => new DrizzleProfileRepository(getDb());
export const applicationRepository = () => new DrizzleApplicationRepository(getDb());
export const accountRepository = () => new DrizzleAccountRepository(getDb());
const renderer = () => new TypstResumeRenderer(process.env.TYPST_BIN ?? "typst");

// Stored resumes: PDF downloads, deletion and expiry. Needs no Gemini key.
// One preview cache per server process (kept on globalThis across dev reloads).
const g = globalThis as unknown as { __previewCache?: Map<string, Buffer[]> };
const previewCache = (g.__previewCache ??= new Map());

export const applicationRecords = () =>
  new ApplicationRecords({ applications: applicationRepository(), renderer: renderer(), previewCache });

// Saves what the browser's AI steps produced. No Gemini key on the server.
export function applicationServiceFor(userId: string): ApplicationService {
  return new ApplicationService({
    userId,
    profiles: profileRepository(),
    applications: applicationRepository(),
    renderer: renderer(),
  });
}

export const hnRepository = () => new DrizzleHnRepository(getDb());

// The HN "Who is hiring?" sync. Parsing uses the instance owner's own Gemini key
// (GEMINI_API_KEY) on public HN posts only; users' keys never reach the server.
export function hnSync(): HnSync {
  const key = process.env.GEMINI_API_KEY?.trim();
  const model = process.env.HN_GEMINI_MODEL?.trim() || "gemini-2.5-flash-lite";
  const threadId = Number(process.env.HN_HIRING_THREAD_ID) || undefined;
  return new HnSync({
    hn: new HnApiClient(),
    repo: hnRepository(),
    llm: key ? new GeminiLlm(key, { models: { fast: model, write: model } }) : null,
    threadId,
    log: (message) => console.warn(message),
  });
}
