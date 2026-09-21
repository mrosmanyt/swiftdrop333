import { NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { acceptOrder, canCourierAcceptOrder, getCourierProfileByUserId } from "@/lib/repo";
import { courierBlockReason } from "@/lib/guards";
import { NextRequest } from "next/server";

// POST /api/orders/:id/accept — courier accepts a PENDING offer.
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole("COURIER");
  if (auth instanceof NextResponse) return auth;

  const courier = getCourierProfileByUserId(auth.id);
  const blocked = courierBlockReason(courier);
  if (blocked) return NextResponse.json({ error: blocked }, { status: 403 });

  // Either they hold a live targeted offer, or the order has fallen
  // through to broadcast mode where anyone online can take it.
  if (!canCourierAcceptOrder(params.id, courier!.id)) {
    return NextResponse.json(
      { error: "This offer isn't yours or has expired." },
      { status: 403 }
    );
  }

  const ok = acceptOrder(params.id, courier!.id);
  if (!ok) {
    return NextResponse.json(
      { error: "Offer no longer available — another courier may have taken it." },
      { status: 409 }
    );
  }
  return NextResponse.json({ ok: true });
}
