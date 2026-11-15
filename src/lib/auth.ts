import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { findUserByEmail, writeAudit } from "@/lib/repo";
import { clientIp, hit, isBlocked, reset } from "@/lib/rateLimit";

// Placeholder values that ship in .env.example / docs. A JWT signed with a
// publicly known secret can be forged into an ADMIN session by anyone, so
// refuse to run in production with one of these instead of silently
// accepting it.
const KNOWN_PLACEHOLDER_SECRETS = new Set([
  "generate-with-openssl-rand-base64-32",
  "changeme",
  "secret",
  "your-secret-here",
]);
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";
if (process.env.NODE_ENV === "production" && !isBuildPhase) {
  const secret = process.env.NEXTAUTH_SECRET ?? "";
  if (!secret || KNOWN_PLACEHOLDER_SECRETS.has(secret)) {
    throw new Error(
      "NEXTAUTH_SECRET is missing or still the placeholder value. Generate one with `openssl rand -base64 32` and set it in the environment."
    );
  }
  if (secret.length < 32) {
    console.warn("[security] NEXTAUTH_SECRET is shorter than 32 characters — use `openssl rand -base64 32` for a stronger one.");
  }
}

// Brute-force protection: per-account and per-IP failure budgets.
// Per account+IP: stops a single attacker quickly without letting a
// stranger lock the real owner out from their own connection.
const LOGIN_FAILS_PER_ACCOUNT_IP = 8; // per 15 minutes
// Per account from anywhere: caps distributed guessing; high enough that
// it takes a deliberate attack to trip it.
const LOGIN_FAILS_PER_ACCOUNT = 50; // per 15 minutes
const LOGIN_FAILS_PER_IP = 30; // per 15 minutes
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

/**
 * NextAuth config shared by all 4 front-ends. Role + user id live on the
 * JWT/session so every server component and API route can identify who's
 * asking with `getSessionUser()` (src/lib/session.ts).
 */
// A valid-format bcrypt hash of a value nobody can type, used only to keep
// the authorize() timing constant when no account matches (see below).
const DUMMY_HASH = "$2a$10$CwTycUXWue0Thq9StjUM0uJ8W5R9j2ISOA1Ii3WSGZKz2FzKz9EX2";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Email & password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email.trim().toLowerCase();
        const ip = clientIp((req as any)?.headers);
        const acctIpKey = `login:acctip:${email}|${ip}`;
        const acctKey = `login:acct:${email}`;
        const ipKey = `login:ip:${ip}`;

        // Too many recent failures for this account or from this IP: refuse
        // without even checking the password, so guessing can't continue.
        if (
          isBlocked(acctIpKey, LOGIN_FAILS_PER_ACCOUNT_IP) ||
          isBlocked(acctKey, LOGIN_FAILS_PER_ACCOUNT) ||
          isBlocked(ipKey, LOGIN_FAILS_PER_IP)
        ) {
          throw new Error("Too many sign-in attempts. Please wait 15 minutes and try again.");
        }

        let user: Awaited<ReturnType<typeof findUserByEmail>>;
        try {
          user = await findUserByEmail(email);
          console.log("[auth] email:", email, "found:", !!user, "status:", user?.status);
        } catch (e) {
          // A database problem is not a wrong password — say so, and keep
          // the real error in the server log instead of on the sign-in page.
          console.error("[auth] user lookup failed", e);
          throw new Error("Sign-in is temporarily unavailable. Please try again in a moment.");
        }
        // Compare against a dummy hash even when the email doesn't exist.
        // Skipping bcrypt entirely on a miss makes "no such account" return
        // in ~1ms while a wrong password takes ~100ms — an attacker timing
        // that gap can enumerate which emails are registered. With only a
        // couple of admin accounts on this platform, that's worth closing.
        const hash = user?.passwordHash ?? DUMMY_HASH;
        const isValid = await bcrypt.compare(credentials.password, hash);
        if (!user || !isValid) {
          hit(acctIpKey, LOGIN_FAILS_PER_ACCOUNT_IP, LOGIN_WINDOW_MS);
          hit(acctKey, LOGIN_FAILS_PER_ACCOUNT, LOGIN_WINDOW_MS);
          hit(ipKey, LOGIN_FAILS_PER_IP, LOGIN_WINDOW_MS);
          return null;
        }

        // Suspended / deleted accounts can't sign in, even with the right
        // password (this is also what keeps the demo seed accounts out of
        // production — see db.ts).
        if (user.status !== "active") {
          throw new Error("This account is not active. Contact support if you think this is a mistake.");
        }

        reset(acctIpKey);
        // Staff sign-ins appear in the admin console's activity log.
        if (user.role === "ADMIN") await writeAudit(user.id, "staff_signed_in", "user", user.id).catch(() => {});
        return { id: user.id, email: user.email, role: user.role, staffRole: user.staffRole } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = (user as any).id;
        // Lets the middleware keep limited staff inside the Website area
        // without a database lookup. The server re-checks the live value.
        token.staffRole = (user as any).staffRole ?? null;
        token.authAt = Date.now();
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
        (session.user as any).authAt = token.authAt ?? 0;
      }
      return session;
    },
  },
};
