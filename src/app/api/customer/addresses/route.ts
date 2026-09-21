import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/session";
import { createCustomerAddress, listCustomerAddresses } from "@/lib/repo";

const schema = z.object({
  label: z.string().max(40).optional(),
  address: z.string().min(3),
  lat: z.number().optional(),
  lng: z.number().optional(),
  isDefault: z.boolean().optional(),
});

export async function GET() {
  const auth = await requireRole("CUSTOMER");
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json({ addresses: listCustomerAddresses(auth.id) });
}

export async function POST(req: NextRequest) {
  const auth = await requireRole("CUSTOMER");
  if (auth instanceof NextResponse) return auth;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const addressId = createCustomerAddress(auth.id, parsed.data);
  return NextResponse.json({ ok: true, addressId }, { status: 201 });
}
