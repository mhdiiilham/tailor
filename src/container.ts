import "server-only";
import { ApplicationService } from "@/application/applications";
import { ApplicationRecords } from "@/application/records";
import { getDb } from "@/infrastructure/db/instance";
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
