import { NextRequest, NextResponse } from "next/server";
import { resolveSender } from "@/lib/chatAuth";
import { signalTyping } from "@/lib/typing";

/**
 * POST /api/orders/:id/messages/typing — "I'm typing right now". Fire and
 * forget from the client on keystroke (debounced); no body needed, the
 * signal is just "this role is active in the thread this instant".
 */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const resolved = await resolveSender(params.id);
  if ("error" in resolved && resolved.error) return resolved.error;
  const { role } = resolved as any;

  signalTyping(params.id, role);
  return NextResponse.json({ ok: true });
}
