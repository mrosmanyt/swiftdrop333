import { NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { resolveSafetyIncident, writeAudit } from "@/lib/repo";

/** POST /api/admin/safety/:id/resolve — an admin confirms the courier is safe and closes the incident. */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const ok = resolveSafetyIncident(params.id, auth.id);
  if (!ok) return NextResponse.json({ error: "Incident not found" }, { status: 404 });

  writeAudit(auth.id, "safety_incident_resolved", "safety_incident", params.id);
  return NextResponse.json({ ok: true });
}
