import "server-only";
import { ApplicationService } from "@/application/applications";
import { ApplicationRecords } from "@/application/records";
import { MissingApiKeyError } from "@/domain/errors";
import { getDb } from "@/infrastructure/db/instance";
import {
  DrizzleAccountRepository,
  DrizzleApplicationRepository,
  DrizzleProfileRepository,
} from "@/infrastructure/db/repositories";
import { GeminiLlm, geminiModelsFromEnv } from "@/infrastructure/llm/geminiLlm";
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

// The key comes from the browser with each request and lives only as long as it.
export function geminiFor(geminiKey: string): GeminiLlm {
  const key = geminiKey.trim();
  if (!key) throw new MissingApiKeyError();
  return new GeminiLlm(key, geminiModelsFromEnv(process.env));
}

export function applicationServiceFor(userId: string, geminiKey: string): ApplicationService {
  return new ApplicationService({
    userId,
    llm: geminiFor(geminiKey),
    profiles: profileRepository(),
    applications: applicationRepository(),
    renderer: renderer(),
  });
}
