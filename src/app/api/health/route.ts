import { sql } from "drizzle-orm";
import { getDb } from "@/infrastructure/db/instance";

// Checked on every request, never prerendered at build time.
export const dynamic = "force-dynamic";

// Used by the Docker HEALTHCHECK (and Coolify). Healthy means the database answers.
export async function GET() {
  try {
    await getDb().execute(sql`select 1`);
    return Response.json({ status: "ok" });
  } catch {
    return Response.json({ status: "error" }, { status: 503 });
  }
}
