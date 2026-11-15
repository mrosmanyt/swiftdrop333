import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Runs the account-creating part of a sign-up as one transaction, so a
 * failure half-way can't leave a user row without its profile (which would
 * make the email "already taken" with no usable account behind it).
 *
 * Returns the created id, or a JSON error response that is safe to send:
 * the real error stays in the server log.
 */
export async function createAccount<T>(what: string, create: () => Promise<T>): Promise<T | NextResponse> {
  try {
    return await db.tx(create);
  } catch (e: any) {
    // 23505 = unique violation: two sign-ups for the same email raced.
    if (e?.code === "23505") {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }
    console.error(`[signup] ${what} failed`, e);
    return NextResponse.json(
      { error: "We couldn't create your account right now. Nothing is wrong with your details — please try again in a moment." },
      { status: 500 }
    );
  }
}
