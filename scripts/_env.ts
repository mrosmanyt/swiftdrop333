/**
 * Loads .env.local and .env for the command-line scripts (Next.js does this
 * itself for the app; plain `tsx scripts/…` does not). Import this FIRST, so
 * DATABASE_URL is set before the database module reads it. Variables that
 * are already set in the shell win; .env.local wins over .env.
 */
import fs from "node:fs";

for (const file of [".env.local", ".env"]) {
  if (fs.existsSync(file)) {
    try {
      process.loadEnvFile(file);
    } catch (e) {
      console.warn(`  ! Could not read ${file}:`, (e as Error).message);
    }
  }
}

/** True when the scripts are pointed at a hosted database rather than the local dev one. */
export const usingRemoteDatabase = Boolean(
  process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL_UNPOOLED
);
