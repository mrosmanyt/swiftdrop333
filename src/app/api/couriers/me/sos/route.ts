import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/session";
import { adminUserIds, createSafetyIncident, getCourierProfileByUserId, listActiveOrdersForCourier } from "@/lib/repo";
import { pushToUser } from "@/lib/push";

const schema = z.object({
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  note: z.string().max(500).optional(),
});

/**
 * POST /api/couriers/me/sos — the panic button. Records an incident and
 * pushes every admin immediately; falls back to the courier's last known
 * ping if the browser couldn't get a fresh GPS fix in the moment (which,
 * for an actual emergency, is exactly when that's likely to fail).
 */
export async function POST(req: NextRequest) {
  const auth = await requireRole("COURIER");
  if (auth instanceof NextResponse) return auth;

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const courier = getCourierProfileByUserId(auth.id);
  if (!courier) return NextResponse.json({ error: "No courier profile" }, { status: 404 });

  const lat = parsed.data.lat ?? courier.lastLat ?? null;
  const lng = parsed.data.lng ?? courier.lastLng ?? null;
  const active = listActiveOrdersForCourier(courier.id);
  const orderId = active[0]?.id ?? null;

  const incidentId = createSafetyIncident({ courierId: courier.id, orderId, lat, lng, note: parsed.data.note ?? null });

  const name = courier.fullName ?? "A courier";
  const locationNote = lat != null && lng != null ? " — location attached" : " — no location available";
  for (const adminUserId of adminUserIds()) {
    void pushToUser(adminUserId, {
      title: "🆘 SOS — courier needs help",
      body: `${name} pressed SOS${locationNote}.`,
      url: "/admin/safety",
      tag: "sos",
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true, incidentId }, { status: 201 });
}
