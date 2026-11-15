import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { findUserById, setUserPassword } from "@/lib/repo";
import { hit } from "@/lib/rateLimit";
import { passwordProblem } from "@/lib/password";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(200),
});


/** POST /api/account/password — any signed-in user changes their own password. */
export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  if (!hit(`pwchange:${session.id}`, 5, 15 * 60 * 1000).ok) {
    return NextResponse.json({ error: "Too many attempts — wait 15 minutes." }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Enter your current and new password." }, { status: 400 });

  const problem = passwordProblem(parsed.data.newPassword);
  if (problem) return NextResponse.json({ error: `New password needs ${problem}.` }, { status: 400 });

  const user = await findUserById(session.id);
  if (!user || !(await bcrypt.compare(parsed.data.currentPassword, user.passwordHash))) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
  }
  if (await bcrypt.compare(parsed.data.newPassword, user.passwordHash)) {
    return NextResponse.json({ error: "New password must be different from the current one." }, { status: 400 });
  }

  await setUserPassword(user.id, await bcrypt.hash(parsed.data.newPassword, 12));
  return NextResponse.json({ ok: true });
}
