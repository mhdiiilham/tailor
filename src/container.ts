import "server-only";
import { ApplicationService } from "@/application/applications";
import { MissingApiKeyError } from "@/domain/errors";
import { getDb } from "@/infrastructure/db/instance";
import { DrizzleApplicationRepository, DrizzleProfileRepository } from "@/infrastructure/db/repositories";
import { GeminiLlm, geminiModelsFromEnv } from "@/infrastructure/llm/geminiLlm";
import { TypstResumeRenderer } from "@/infrastructure/typst/typstRenderer";

export const profileRepository = () => new DrizzleProfileRepository(getDb());
export const applicationRepository = () => new DrizzleApplicationRepository(getDb());

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
    renderer: new TypstResumeRenderer(process.env.TYPST_BIN ?? "typst"),
  });
}
