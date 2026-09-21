import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/session";
import { getCourierProfileByUserId, getOrderById, recordAgeVerification } from "@/lib/repo";

const schema = z.object({
  method: z.enum(["id_checked", "refused_underage", "refused_no_id"]),
  dobConfirmed: z.boolean().optional(),
});

/**
 * POST /api/orders/:id/age-verify — record the ID check for an
 * age-restricted delivery (alcohol, pharmacy). The delivery endpoint
 * refuses to complete without this, and a refusal sends the parcel back
 * rather than leaving it.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole("COURIER");
  if (auth instanceof NextResponse) return auth;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const courier = getCourierProfileByUserId(auth.id);
  if (!courier) return NextResponse.json({ error: "No courier profile" }, { status: 400 });

  const order = getOrderById(params.id);
  if (!order || order.courierId !== courier.id) {
    return NextResponse.json({ error: "Not your delivery" }, { status: 403 });
  }
  if (!order.requiresAgeVerification) {
    return NextResponse.json({ error: "This delivery isn't age-restricted" }, { status: 400 });
  }
  if (parsed.data.method === "id_checked" && !parsed.data.dobConfirmed) {
    return NextResponse.json(
      { error: "Confirm you checked the date of birth on the ID." },
      { status: 400 }
    );
  }

  recordAgeVerification(params.id, courier.id, parsed.data.method);

  return NextResponse.json({
    ok: true,
    mustReturn: parsed.data.method !== "id_checked",
  });
}
