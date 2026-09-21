/**
 * First-run setup — works the same on Windows, macOS and Linux.
 *
 *   npm run setup
 *
 * Creates .env from .env.example (if it doesn't already exist) and fills
 * in a real NEXTAUTH_SECRET, so nobody has to hand-edit the file or hunt
 * for an `openssl` binary on Windows.
 */
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const envPath = path.join(root, ".env");
const examplePath = path.join(root, ".env.example");

const major = Number(process.versions.node.split(".")[0]);
if (major < 22) {
  console.error(
    `\n  ✗ Node ${process.versions.node} detected — SwiftDrop needs Node 22 or newer\n` +
      `    (the database uses Node's built-in node:sqlite module).\n` +
      `    Download the LTS build from https://nodejs.org and run this again.\n`
  );
  process.exit(1);
}

if (fs.existsSync(envPath)) {
  console.log("  • .env already exists — leaving it alone.");
} else {
  if (!fs.existsSync(examplePath)) {
    console.error("  ✗ .env.example is missing — can't create .env.");
    process.exit(1);
  }
  const secret = randomBytes(32).toString("base64");
  const env = fs
    .readFileSync(examplePath, "utf8")
    .replace("generate-with-openssl-rand-base64-32", secret);

  // Written without a BOM so the env parser reads the first key correctly.
  fs.writeFileSync(envPath, env, { encoding: "utf8" });
  console.log("  ✓ Created .env with a fresh NEXTAUTH_SECRET.");
}

console.log("\n  Next:  npm run seed     (creates the database + test accounts)");
console.log("         npm run dev      (starts http://localhost:3000)\n");
