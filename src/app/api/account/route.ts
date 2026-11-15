import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { closeAccountWithGrace, eraseUserAccount, findUserById } from "@/lib/repo";
import { deleteDocumentFile } from "@/lib/storage";
import { RETENTION } from "@/lib/retention";
import { hit } from "@/lib/rateLimit";
import { db } from "@/lib/db";

const schema = z.object({ password: z.string().min(1) });

/**
 * DELETE /api/account — the signed-in user deletes their own account.
 *
 * Customers: erased immediately (name, email, phone, saved addresses and
 * order links are removed).
 * Couriers / merchants: closed immediately (can't sign in, profile hidden)
 * and permanently erased after the grace period, so a pending payout or an
 * open delivery claim can still be settled first.
 * Admins: not self-service.
 */
export async function DELETE(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (session.role === "ADMIN") {
    return NextResponse.json({ error: "Admin accounts can't be self-deleted." }, { status: 403 });
  }
  if (!hit(`acctdelete:${session.id}`, 5, 15 * 60 * 1000).ok) {
    return NextResponse.json({ error: "Too many attempts — wait 15 minutes." }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Confirm with your password." }, { status: 400 });

  const user = await findUserById(session.id);
  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    return NextResponse.json({ error: "Password is incorrect." }, { status: 400 });
  }

  if (session.role === "CUSTOMER") {
    await Promise.all((await eraseUserAccount(user.id, user.id, "deleted by the customer")).map(deleteDocumentFile));
    return NextResponse.json({ ok: true, erased: true });
  }

  // Don't strand parcels or money: finish (or hand back) active work first.
  const busy =
    session.role === "COURIER"
      ? await db
          .prepare(
            `SELECT
               (SELECT COUNT(*) FROM orders o JOIN courier_profiles c ON c.id = o.courier_id
                 WHERE c.user_id = ? AND o.status IN ('ASSIGNED','PICKED_UP','IN_TRANSIT','RETURNING')) AS orders,
               (SELECT COUNT(*) FROM payout_requests p JOIN courier_profiles c ON c.id = p.courier_id
                 WHERE c.user_id = ? AND p.status IN ('requested','approved')) AS payouts`
          )
          .get(user.id, user.id)
      : await db
          .prepare(
            `SELECT (SELECT COUNT(*) FROM orders o JOIN merchant_profiles m ON m.id = o.merchant_id
                      WHERE m.user_id = ? AND o.deleted_at IS NULL
                        AND o.status IN ('PENDING','ASSIGNED','PICKED_UP','IN_TRANSIT','RETURNING')) AS orders,
                    0 AS payouts`
          )
          .get(user.id);
  const b = busy as { orders: number; payouts: number };
  if (b.orders > 0 || b.payouts > 0) {
    return NextResponse.json(
      {
        error:
          b.orders > 0
            ? "You still have deliveries in progress. Complete or cancel them before closing your account."
            : "You have a payout request still being processed. Close your account once it's paid.",
      },
      { status: 409 }
    );
  }

  await closeAccountWithGrace(user.id);
  return NextResponse.json({ ok: true, erased: false, eraseAfterDays: RETENTION.erasureGraceDays });
}
