import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/session";
import { getCourierProfileByUserId, setCourierEmergencyContact } from "@/lib/repo";

const schema = z.object({ name: z.string().min(2), phone: z.string().min(7) });

/** PATCH /api/couriers/me/safety — save the emergency contact an SOS/location-share is really for. */
export async function PATCH(req: NextRequest) {
  const auth = await requireRole("COURIER");
  if (auth instanceof NextResponse) return auth;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const courier = getCourierProfileByUserId(auth.id);
  if (!courier) return NextResponse.json({ error: "No courier profile" }, { status: 404 });

  setCourierEmergencyContact(courier.id, parsed.data.name, parsed.data.phone);
  return NextResponse.json({ ok: true });
}
