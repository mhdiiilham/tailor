// Runs once when the server starts: apply pending database migrations.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { getDb } = await import("@/infrastructure/db/instance");
  const { migrateDb } = await import("@/infrastructure/db/client");
  await migrateDb(getDb());
}
