import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { isLimitedStaff } from "@/lib/cms/permissions";

/**
 * Role-based route protection for the four internal portals.
 * Public routes (/, /track/*, /login, /api/orders POST for webhooks) are
 * left open — everything under /merchant, /driver, /admin, /customer
 * requires a signed-in user with the matching role.
 */
export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = (req.nextauth.token as any)?.role;

    if (pathname.startsWith("/merchant") && role !== "MERCHANT") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (pathname.startsWith("/driver") && role !== "COURIER") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    // Content editors, sales staff and viewers only ever see the Website
    // area (plus their own account screen). The pages and API routes refuse
    // them as well — this just sends them somewhere useful.
    if (
      pathname.startsWith("/admin") &&
      isLimitedStaff((req.nextauth.token as any)?.staffRole) &&
      !pathname.startsWith("/admin/website") &&
      !pathname.startsWith("/admin/account")
    ) {
      return NextResponse.redirect(new URL("/admin/website", req.url));
    }
    if (pathname.startsWith("/customer") && role !== "CUSTOMER") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/merchant/:path*", "/driver/:path*", "/admin/:path*", "/customer/:path*"],
};
