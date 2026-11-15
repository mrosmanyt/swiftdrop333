import { NextRequest, NextResponse } from "next/server";
import { clientIp, hit } from "@/lib/rateLimit";
import { recordPageView } from "@/lib/cms/analytics";

export const dynamic = "force-dynamic";

// POST /api/cms/hit { path, referrer } — one page view. No cookie is set
// and nothing that identifies the visitor is stored (see lib/cms/analytics.ts).
export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  if (!hit(`pv:${ip}`, 120, 60_000).ok) return new NextResponse(null, { status: 204 });
  try {
    const body = JSON.parse((await req.text()).slice(0, 2000));
    await recordPageView({
      path: String(body?.path ?? "").slice(0, 200),
      referrer: String(body?.referrer ?? "").slice(0, 500),
      ip,
      userAgent: req.headers.get("user-agent") ?? "",
      host: req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "",
    });
  } catch {
    // Counting a visit must never show an error to the visitor.
  }
  return new NextResponse(null, { status: 204 });
}
