import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { addTicketMessage, getTicket, listTicketMessages } from "@/lib/repo";

/** A requester can read and reply to their own ticket. Internal admin
 *  notes are filtered out for them. */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  const ticket = getTicket(params.id);
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

  const isAdmin = user?.role === "ADMIN";
  const isOwner = user && ticket.opened_by_user_id === user.id;
  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "Not your ticket" }, { status: 403 });
  }

  return NextResponse.json({
    ticket,
    messages: listTicketMessages(params.id, !!isAdmin),
  });
}

const schema = z.object({ body: z.string().min(1).max(4000), internal: z.boolean().optional() });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  const ticket = getTicket(params.id);
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

  const isAdmin = user?.role === "ADMIN";
  const isOwner = user && ticket.opened_by_user_id === user.id;
  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "Not your ticket" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  addTicketMessage({
    ticketId: params.id,
    senderRole: isAdmin ? "admin" : String(user?.role ?? "customer").toLowerCase(),
    senderUserId: user?.id ?? null,
    body: parsed.data.body,
    internal: isAdmin ? !!parsed.data.internal : false,
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
