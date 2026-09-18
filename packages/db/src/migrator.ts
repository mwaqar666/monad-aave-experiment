import { join } from "node:path";
import { migrate } from "drizzle-orm/bun-sql/migrator";
import { sql } from "drizzle-orm";

import { database } from "./database.ts";

console.log("🔄 [Prestart] Checking database schema...");

try {
  // Use an advisory lock to queue up containers booting at the same time
  await database.withLogging().transaction(
    async (transaction): Promise<void> => {
      const MIGRATION_LOCK_ID = 8472947291;

      console.log("🔒 [Prestart] Waiting for global migration lock...");
      await transaction.execute(sql`SELECT pg_advisory_xact_lock(${MIGRATION_LOCK_ID})`);
      console.log("🔑 [Prestart] Lock acquired. Synchronizing tables...");

      await migrate(transaction, { migrationsFolder: join(import.meta.dir, "..", "migrations") });
    },
    { isolationLevel: "serializable" },
  );

  console.log("✅ [Prestart] Database is ready. Proceeding to application launch.");
} catch (error) {
  console.error("❌ [Prestart] Critical Migration Failure:", error);
  process.exit(1);
}
