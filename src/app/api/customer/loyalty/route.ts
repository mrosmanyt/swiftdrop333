import { NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { getLoyaltyAccount, listLoyaltyTransactions } from "@/lib/repo";

/** GET /api/customer/loyalty — points balance, referral code, and recent activity. */
export async function GET() {
  const auth = await requireRole("CUSTOMER");
  if (auth instanceof NextResponse) return auth;

  const account = getLoyaltyAccount(auth.id);
  const transactions = listLoyaltyTransactions(auth.id, 50);
  return NextResponse.json({ account, transactions });
}
