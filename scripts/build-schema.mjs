/**
 * Compiles migrations/NNN-name.sql into src/lib/schema.ts so the schema ships
 * inside the app bundle and is applied automatically on first connection
 * (see src/lib/db.ts). Run after adding or editing a migration:
 *
 *   npm run build:schema
 *
 * Never edit a migration that has already been applied to a live database —
 * add a new numbered file instead.
 */
import fs from "node:fs";

const files = fs.readdirSync("migrations").filter((f) => /^\d{3}-.+\.sql$/.test(f)).sort();
const entries = files.map((f) => {
  const sql = fs
    .readFileSync(`migrations/${f}`, "utf8")
    .replace(/^\s*BEGIN;\s*$/m, "")
    .replace(/^\s*COMMIT;\s*$/m, "")
    .trim();
  if (sql.includes("`") || sql.includes("${")) throw new Error(`${f}: backticks and \${ are not supported in migrations`);
  return `  { version: ${Number(f.slice(0, 3))}, name: ${JSON.stringify(f.replace(/\.sql$/, ""))}, sql: String.raw\`${sql}\n\` },`;
});
fs.writeFileSync(
  "src/lib/schema.ts",
  `// GENERATED from migrations/*.sql by scripts/build-schema.mjs — do not edit by hand.\n` +
    `// Each entry is applied once, in order, and recorded in schema_migrations.\n` +
    `export const MIGRATIONS: { version: number; name: string; sql: string }[] = [\n${entries.join("\n")}\n];\n`
);
console.log(`Compiled ${files.length} migration(s) into src/lib/schema.ts`);
