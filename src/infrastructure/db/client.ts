import path from "node:path";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import * as schema from "./schema";

// Any Postgres driver Drizzle supports: node-postgres in the app, PGlite in tests.
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

export const migrationsFolder = path.join(process.cwd(), "drizzle");

export function openDb(connectionString: string) {
  return drizzle(new Pool({ connectionString, max: 5 }), { schema });
}

export async function migrateDb(db: ReturnType<typeof openDb>): Promise<void> {
  await migrate(db, { migrationsFolder });
}
