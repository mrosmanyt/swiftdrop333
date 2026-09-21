import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/session";
import { adminAssignOrder, getCourierProfileById } from "@/lib/repo";

const schema = z.object({ courierId: z.string().min(1) });

// POST /api/admin/orders/:id/assign — manual dispatch override: admin
// forces an order onto a specific courier (stuck order, VIP delivery, etc).
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const courier = getCourierProfileById(parsed.data.courierId);
  if (!courier) return NextResponse.json({ error: "Courier not found" }, { status: 404 });
  if (courier.approvalStatus !== "approved") {
    return NextResponse.json({ error: "That courier isn't approved" }, { status: 400 });
  }

  const ok = adminAssignOrder(params.id, courier.id, auth.id);
  if (!ok) return NextResponse.json({ error: "Order can't be assigned in its current state" }, { status: 409 });
  return NextResponse.json({ ok: true });
}
