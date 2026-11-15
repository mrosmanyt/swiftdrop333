import { NextRequest, NextResponse } from "next/server";
import { readPodPhoto } from "@/lib/storage";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

/**
 * GET /api/pod/:name — serves a proof-of-delivery photo.
 *
 * Same trust model as the tracking page that shows it: the photo's random
 * 128-bit name is only ever revealed alongside its order. A photo that
 * isn't attached to any order yet is only visible to signed-in couriers
 * (the one who just uploaded it, previewing before confirming delivery).
 */
export async function GET(_req: NextRequest, { params }: { params: { name: string } }) {
  const url = `/api/pod/${params.name}`;
  const attached = await db.prepare(`SELECT 1 FROM orders WHERE proof_of_delivery_url = ? LIMIT 1`).get(url);
  if (!attached) {
    const user = await getSessionUser();
    if (!user || (user.role !== "COURIER" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  const file = await readPodPhoto(params.name);
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return new NextResponse(new Uint8Array(file.bytes), {
    headers: {
      "Content-Type": file.mime,
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
