/**
 * Create (or update) an admin account.
 *
 *   npm run create-admin -- you@example.com "your-password"
 *   npm run create-admin -- you@example.com            # then type it when asked
 *
 * There is deliberately no self-serve admin signup anywhere in the app —
 * admins exist only because someone with server access ran this. If the
 * email already belongs to an admin, this resets their password instead of
 * failing, so a locked-out admin can be recovered the same way.
 *
 * Passing the password as an argument leaves it in your shell history. For
 * anything you actually care about, omit it and type it at the prompt.
 */
import bcrypt from "bcryptjs";
import readline from "node:readline";
import { db } from "../src/lib/db";
import { createUser, createAdminProfile, findUserByEmail } from "../src/lib/repo";

const PERMISSIONS = [
  "manage_merchants",
  "manage_couriers",
  "manage_pricing",
  "manage_orders",
  "manage_payouts",
  "manage_support",
];

/** Weak passwords on an account that can see every order and payout are not
 *  a matter of taste, so the bar is enforced rather than suggested. */
function passwordProblem(pw: string): string | null {
  if (pw.length < 8) return "at least 8 characters";
  if (!/[a-z]/.test(pw)) return "a lowercase letter";
  if (!/[A-Z]/.test(pw)) return "an uppercase letter";
  if (!/[0-9]/.test(pw)) return "a digit";
  return null;
}

function ask(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) =>
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    })
  );
}

async function main() {
  const [emailArg, passwordArg] = process.argv.slice(2);

  const email = (emailArg ?? (await ask("Admin email: "))).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error(`  ✗ "${email}" doesn't look like an email address.`);
    process.exit(1);
  }

  const password = passwordArg ?? (await ask("Password: "));
  const problem = passwordProblem(password);
  if (problem) {
    console.error(`  ✗ Password needs ${problem}.`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const existing = findUserByEmail(email) as any;

  if (existing) {
    if (existing.role !== "ADMIN") {
      console.error(
        `  ✗ ${email} already exists as a ${existing.role}. Use a different address —\n` +
          `    one login can't be both a merchant/courier and an admin.`
      );
      process.exit(1);
    }
    db.prepare(`UPDATE users SET password_hash = ?, status = 'active', updated_at = datetime('now') WHERE id = ?`)
      .run(passwordHash, existing.id);
    console.log(`  ✓ Password reset for existing admin ${email}.`);
    return;
  }

  const userId = createUser({ email, passwordHash, role: "ADMIN" });
  createAdminProfile({ userId, permissions: PERMISSIONS });
  console.log(`  ✓ Admin created: ${email}`);
  console.log(`    Sign in at /login — the console is at /admin (never linked from the public site).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
