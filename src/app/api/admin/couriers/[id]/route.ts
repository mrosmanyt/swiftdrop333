import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/session";
import {
  getCourierProfileById,
  setCourierApprovalStatus,
  setCourierBackgroundCheck,
  setUserStatus,
  softDeleteCourier,
} from "@/lib/repo";

const schema = z.object({
  approvalStatus: z.enum(["pending", "approved", "rejected", "suspended"]).optional(),
  backgroundCheckStatus: z.enum(["pending", "passed", "failed"]).optional(),
  userStatus: z.enum(["active", "suspended"]).optional(),
  notes: z.string().max(1000).optional(),
});

// PATCH /api/admin/couriers/:id — approve, reject, suspend a courier, or
// record the outcome of their background check.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const courier = getCourierProfileById(params.id);
  if (!courier) return NextResponse.json({ error: "Courier not found" }, { status: 404 });

  if (parsed.data.backgroundCheckStatus) {
    setCourierBackgroundCheck(courier.id, parsed.data.backgroundCheckStatus);
  }
  if (parsed.data.approvalStatus) {
    setCourierApprovalStatus(courier.id, parsed.data.approvalStatus, auth.id, parsed.data.notes);
  }
  if (parsed.data.userStatus) {
    setUserStatus(courier.userId, parsed.data.userStatus);
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/couriers/:id — soft delete: hides the courier from every
// normal list and moves it into /admin/deleted-records; the row stays in the
// database so it can be restored later.
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const courier = getCourierProfileById(params.id);
  if (!courier) return NextResponse.json({ error: "Courier not found" }, { status: 404 });

  softDeleteCourier(courier.id, auth.id);
  return NextResponse.json({ ok: true });
}
