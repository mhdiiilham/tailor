const PURGE_EVERY_MS = 15 * 60 * 1000;
const HN_SYNC_EVERY_MS = 3 * 60 * 60 * 1000;

// Runs once when the server starts: apply database migrations, then delete stored
// PDFs older than 24 hours (now and every 15 minutes), and sync the HN "Who is
// hiring?" posts (now and every 3 hours).
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { getDb } = await import("@/infrastructure/db/instance");
  const { migrateDb } = await import("@/infrastructure/db/client");
  const { applicationRecords, hnSync } = await import("@/container");

  await migrateDb(getDb());

  const purge = () =>
    applicationRecords()
      .purgeExpiredPdfs()
      .then((n) => n > 0 && console.info(`[retention] deleted ${n} expired PDF(s)`))
      .catch((err) => console.error("[retention] purge failed", err));

  await purge();
  setInterval(purge, PURGE_EVERY_MS).unref();

  // Never two syncs at once: a slow first load of a month mustn't overlap the next tick.
  let syncing = false;
  const sync = async () => {
    if (syncing) return;
    syncing = true;
    try {
      const { thread, added, parsed } = await hnSync().run();
      if (added || parsed) console.info(`[hn] thread ${thread}: ${added} new post(s), ${parsed} parsed`);
    } catch (err) {
      console.error("[hn] sync failed", err);
    } finally {
      syncing = false;
    }
  };
  void sync(); // in the background, so startup isn't held up by HN
  setInterval(sync, HN_SYNC_EVERY_MS).unref();
}
