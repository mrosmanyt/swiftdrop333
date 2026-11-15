import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { findUserById, type Role } from "@/lib/repo";

export interface SessionUser {
  id: string;
  email: string;
  role: Role;
}

/** Use in server components and API routes to get the signed-in user (or null). */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const u = session.user as any;
  // The JWT is valid for its whole lifetime even if an admin suspends or
  // deletes the account in the meantime — so re-check the live record on
  // every request (a single primary-key lookup).
  const live = u.id ? await findUserById(u.id) : null;
  if (!live || live.status !== "active" || live.role !== u.role) return null;
  // Changing the password signs out every session issued before it.
  if (live.passwordChangedAt && Number(u.authAt ?? 0) < Date.parse(live.passwordChangedAt)) return null;
  return { id: live.id, email: live.email, role: live.role };
}

/**
 * API-route guard: returns the session user if their role matches, otherwise
 * returns a NextResponse (401/403) to send straight back — call sites do
 * `const auth = await requireRole(...); if (auth instanceof NextResponse) return auth;`
 */
export async function requireRole(...roles: Role[]) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!roles.includes(user.role)) {
    return NextResponse.json({ error: "Forbidden for this role" }, { status: 403 });
  }
  return user;
}
