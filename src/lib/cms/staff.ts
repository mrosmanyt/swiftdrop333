import { NextRequest, NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { getSessionUser, type SessionUser } from "@/lib/session";
import { CSRF_HEADER, can, type Permission } from "./permissions";

/**
 * Guards for the Website area of the admin console.
 *
 * Every API route starts with:
 *   const staff = await requireStaff("content.edit", req);
 *   if (staff instanceof NextResponse) return staff;
 *
 * The check always uses the live database record (role, status, staff role),
 * never just what the browser's session says.
 */
export async function requireStaff(permission: Permission, req?: NextRequest): Promise<SessionUser | NextResponse> {
  const user = await getSessionUser({ allowLimitedStaff: true });
  if (!user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  if (user.role !== "ADMIN" || !can(user.staffRole, permission)) {
    return NextResponse.json({ error: "Your role is not allowed to do this." }, { status: 403 });
  }
  if (req && req.method !== "GET" && req.method !== "HEAD") {
    // CSRF: another website can make a browser send our cookie, but it
    // cannot add a custom header or fake the Origin.
    if (req.headers.get(CSRF_HEADER) !== "1") {
      return NextResponse.json({ error: "Request blocked for safety. Reload the page and try again." }, { status: 403 });
    }
    const origin = req.headers.get("origin");
    if (origin) {
      let originHost = "";
      try {
        originHost = new URL(origin).host;
      } catch {}
      const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
      if (originHost !== host) {
        return NextResponse.json({ error: "Request blocked for safety." }, { status: 403 });
      }
    }
  }
  return user;
}

/** For server pages: returns the staff member or sends them away. */
export async function staffPage(permission: Permission): Promise<SessionUser> {
  const user = await getSessionUser({ allowLimitedStaff: true });
  if (!user || user.role !== "ADMIN") redirect("/login");
  if (!can(user.staffRole, permission)) redirect("/admin/website");
  return user;
}

/** Admin responses must never be cached or framed. */
export function adminJson(body: unknown, init: { status?: number } = {}) {
  return NextResponse.json(body, {
    status: init.status ?? 200,
    headers: { "Cache-Control": "no-store", "X-Frame-Options": "DENY", "X-Robots-Tag": "noindex, nofollow" },
  });
}
