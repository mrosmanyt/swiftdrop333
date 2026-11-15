import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { getCourierProfileById, restoreCourier } from "@/lib/repo";

// POST /api/admin/couriers/:id/restore — brings a soft-deleted courier back
// out of /admin/deleted-records into every normal list.
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const courier = await getCourierProfileById(params.id);
  if (!courier) return NextResponse.json({ error: "Courier not found" }, { status: 404 });

  if (!await restoreCourier(courier.id, auth.id)) {
    return NextResponse.json({ error: "This account's personal data was already erased — it can't be restored." }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
