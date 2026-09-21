import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/session";
import { addTicketMessage, getTicket, setTicketStatus } from "@/lib/repo";
import { send } from "@/lib/notify";

const schema = z.object({
  status: z.enum(["open", "pending", "resolved", "closed"]).optional(),
  reply: z.string().max(4000).optional(),
  internal: z.boolean().optional(),
});

/** PATCH /api/admin/tickets/:id — reply to, or close, a support ticket.
 *  A non-internal reply is emailed to the requester. */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const ticket = getTicket(params.id);
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

  if (parsed.data.reply) {
    addTicketMessage({
      ticketId: params.id,
      senderRole: "admin",
      senderUserId: auth.id,
      body: parsed.data.reply,
      internal: !!parsed.data.internal,
    });

    if (!parsed.data.internal && ticket.contact_email) {
      await send({
        channel: "email",
        to: ticket.contact_email,
        template: "ticket_reply",
        subject: `Re: ${ticket.subject} (${ticket.reference})`,
        body: parsed.data.reply,
        orderId: ticket.order_id,
      });
    }
  }

  if (parsed.data.status) {
    setTicketStatus(params.id, parsed.data.status, auth.id);
  }

  return NextResponse.json({ ok: true });
}
