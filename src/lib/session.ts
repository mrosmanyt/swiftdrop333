import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { findUserById, type Role } from "@/lib/repo";
import { isLimitedStaff, normalizeStaffRole, type StaffRole } from "@/lib/cms/permissions";

export interface SessionUser {
  id: string;
  email: string;
  role: Role;
  /** Only meaningful when role is ADMIN (see src/lib/cms/permissions.ts). */
  staffRole: StaffRole;
}

/**
 * Use in server components and API routes to get the signed-in user (or null).
 *
 * Limited staff (Content Editor, Sales & Enquiries, Viewer) are ADMIN users
 * who may only use the Website area. For every existing caller they are
 * treated as "not signed in", so no operations page or API route can be
 * reached with one of those accounts. Only the Website area (and the
 * change-password screen) pass `allowLimitedStaff: true`.
 */
export async function getSessionUser(opts: { allowLimitedStaff?: boolean } = {}): Promise<SessionUser | null> {
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
  // "Sign out everywhere", and a staff role change, do the same.
  if (live.sessionsValidAfter && Number(u.authAt ?? 0) < Date.parse(live.sessionsValidAfter)) return null;
  const staffRole = normalizeStaffRole(live.staffRole);
  if (live.role === "ADMIN" && isLimitedStaff(staffRole) && !opts.allowLimitedStaff) return null;
  return { id: live.id, email: live.email, role: live.role, staffRole };
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
