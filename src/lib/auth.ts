import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { findUserByEmail } from "@/lib/repo";

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
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = findUserByEmail(credentials.email);
        // Compare against a dummy hash even when the email doesn't exist.
        // Skipping bcrypt entirely on a miss makes "no such account" return
        // in ~1ms while a wrong password takes ~100ms — an attacker timing
        // that gap can enumerate which emails are registered. With only a
        // couple of admin accounts on this platform, that's worth closing.
        const hash = user?.passwordHash ?? DUMMY_HASH;
        const isValid = await bcrypt.compare(credentials.password, hash);
        if (!user || !isValid) return null;

        return { id: user.id, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = (user as any).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
};
