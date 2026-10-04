import "server-only";
import { openDb } from "./client";

// One pool per server process. Next dev reloads modules, so keep it on globalThis.
const g = globalThis as unknown as { __db?: ReturnType<typeof openDb> };

export function getDb() {
  if (!g.__db) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set.");
    g.__db = openDb(url);
  }
  return g.__db;
}
