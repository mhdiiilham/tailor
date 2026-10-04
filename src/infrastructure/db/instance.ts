import "server-only";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { openDb, type Db } from "./client";

// One connection per server process. Next dev reloads modules, so keep it on globalThis.
const g = globalThis as unknown as { __db?: Db };

export function getDb(): Db {
  if (!g.__db) {
    const file = process.env.DATABASE_URL ?? "./data/career.db";
    // The DB path is runtime config, not a project file, so keep it out of build tracing.
    mkdirSync(path.dirname(path.resolve(/*turbopackIgnore: true*/ file)), { recursive: true });
    g.__db = openDb(file);
  }
  return g.__db;
}
