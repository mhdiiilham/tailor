import "server-only";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { ApplicationService } from "@/application/applications";
import { openDb, type Db } from "@/infrastructure/db/client";
import { DrizzleApplicationRepository, DrizzleProfileRepository } from "@/infrastructure/db/repositories";
import { AiSdkLlm } from "@/infrastructure/llm/aiSdkLlm";
import { loadLlmConfig } from "@/infrastructure/llm/config";
import { TypstResumeRenderer } from "@/infrastructure/typst/typstRenderer";

export const paths = {
  db: process.env.DATABASE_URL ?? "./data/career.db",
  tailored: path.resolve(process.env.TAILORED_DIR ?? "../tailored"),
  profileYaml: path.resolve(process.env.PROFILE_YAML ?? "../profile/profile.yaml"),
};

// One instance per server process. Next dev reloads modules, so keep it on globalThis.
const g = globalThis as unknown as { __db?: Db };

function db(): Db {
  if (!g.__db) {
    mkdirSync(path.dirname(path.resolve(paths.db)), { recursive: true });
    g.__db = openDb(paths.db);
  }
  return g.__db;
}

export const profileRepository = () => new DrizzleProfileRepository(db());
export const applicationRepository = () => new DrizzleApplicationRepository(db());

// Built on demand so the profile pages work before an API key is configured.
export const applicationService = () =>
  new ApplicationService({
    llm: new AiSdkLlm(loadLlmConfig(process.env)),
    profiles: profileRepository(),
    applications: applicationRepository(),
    renderer: new TypstResumeRenderer(paths.tailored, process.env.TYPST_BIN ?? "typst"),
  });
