import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { findUserById } from "@/lib/repo";
import { eraseNow } from "@/lib/retention";

const schema = z.object({ userId: z.string().min(1) });

/**
 * POST /api/admin/erase — permanently anonymise a courier or merchant that
 * has already been deleted (moved to Deleted records). Used for a privacy /
 * deletion request that shouldn't wait for the automatic grace period.
 */
export async function POST(req: NextRequest) {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const user = await findUserById(parsed.data.userId);
  if (!user || user.role === "ADMIN") return NextResponse.json({ error: "User not found" }, { status: 404 });

  const deleted = await db
    .prepare(
      `SELECT 1 FROM courier_profiles WHERE user_id = ? AND deleted_at IS NOT NULL
       UNION SELECT 1 FROM merchant_profiles WHERE user_id = ? AND deleted_at IS NOT NULL`
    )
    .get(user.id, user.id);
  if (!deleted && user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Delete the account first, then erase it." }, { status: 409 });
  }

  await eraseNow(user.id, auth.id);
  return NextResponse.json({ ok: true });
}
