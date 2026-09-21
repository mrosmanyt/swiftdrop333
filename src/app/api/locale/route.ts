import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { setUserLocale } from "@/lib/repo";
import { isLocale } from "@/lib/i18n";

const schema = z.object({ locale: z.string() });

/**
 * POST /api/locale — set language preference. Stored on the account when
 * signed in; always mirrored into a cookie so signed-out customers on a
 * tracking link keep their choice too.
 */
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success || !isLocale(parsed.data.locale)) {
    return NextResponse.json({ error: "Unsupported language" }, { status: 400 });
  }

  const user = await getSessionUser();
  if (user) setUserLocale(user.id, parsed.data.locale);

  const res = NextResponse.json({ ok: true, locale: parsed.data.locale });
  res.cookies.set("locale", parsed.data.locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return res;
}
