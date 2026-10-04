const PURGE_EVERY_MS = 15 * 60 * 1000;

// Runs once when the server starts: apply database migrations, then delete
// stored PDFs older than 24 hours now and every 15 minutes.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { getDb } = await import("@/infrastructure/db/instance");
  const { migrateDb } = await import("@/infrastructure/db/client");
  const { applicationRecords } = await import("@/container");

  await migrateDb(getDb());

  const purge = () =>
    applicationRecords()
      .purgeExpiredPdfs()
      .then((n) => n > 0 && console.info(`[retention] deleted ${n} expired PDF(s)`))
      .catch((err) => console.error("[retention] purge failed", err));

  await purge();
  setInterval(purge, PURGE_EVERY_MS).unref();
}
