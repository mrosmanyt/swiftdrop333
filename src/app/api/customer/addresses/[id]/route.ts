import { NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { deleteCustomerAddress } from "@/lib/repo";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireRole("CUSTOMER");
  if (auth instanceof NextResponse) return auth;

  const ok = deleteCustomerAddress(params.id, auth.id);
  if (!ok) return NextResponse.json({ error: "Address not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
