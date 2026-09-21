import { NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { setDefaultCustomerAddress } from "@/lib/repo";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireRole("CUSTOMER");
  if (auth instanceof NextResponse) return auth;

  const ok = setDefaultCustomerAddress(params.id, auth.id);
  if (!ok) return NextResponse.json({ error: "Address not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
