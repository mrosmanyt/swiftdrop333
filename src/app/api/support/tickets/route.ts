import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { createTicket, listTicketsForUser } from "@/lib/repo";
import { send } from "@/lib/notify";

/**
 * Support tickets — open to everyone, including customers with no account
 * (they reach support from their tracking link, so a delivery problem
 * doesn't dead-end).
 */

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ tickets: [] });
  return NextResponse.json({ tickets: listTicketsForUser(user.id) });
}

const schema = z.object({
  category: z.enum(["delivery", "payment", "account", "app", "other"]).default("other"),
  subject: z.string().min(3).max(200),
  body: z.string().min(5).max(4000),
  orderId: z.string().optional(),
  contactEmail: z.string().email().optional(),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const user = await getSessionUser();
  const role = user
    ? (user.role.toLowerCase() as "merchant" | "courier" | "admin")
    : ("customer" as const);

  // A signed-out customer must leave an email, otherwise there's no way to
  // reply to them.
  if (!user && !parsed.data.contactEmail) {
    return NextResponse.json({ error: "Please include an email so we can reply." }, { status: 400 });
  }

  const { ticketId, reference } = createTicket({
    openedByRole: role,
    openedByUserId: user?.id ?? null,
    contactEmail: parsed.data.contactEmail ?? user?.email ?? null,
    orderId: parsed.data.orderId ?? null,
    category: parsed.data.category,
    subject: parsed.data.subject,
    body: parsed.data.body,
  });

  await send({
    channel: "email",
    to: parsed.data.contactEmail ?? user?.email ?? "",
    template: "ticket_opened",
    subject: `We got your message (${reference})`,
    body: `Thanks for getting in touch. Your reference is ${reference} — our team will reply shortly.\n\nWhat you told us:\n${parsed.data.body}`,
    orderId: parsed.data.orderId,
  });

  return NextResponse.json({ ticketId, reference }, { status: 201 });
}
