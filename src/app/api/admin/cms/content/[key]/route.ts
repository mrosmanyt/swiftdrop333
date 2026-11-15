import { NextRequest, NextResponse } from "next/server";
import { writeAudit } from "@/lib/repo";
import { adminJson, requireStaff } from "@/lib/cms/staff";
import type { Permission } from "@/lib/cms/permissions";
import { getEditorState, isSectionKey, publish, restoreOriginal, saveDraft } from "@/lib/cms/content";

export const dynamic = "force-dynamic";

/** Email alert settings are a setting, not content: they need their own permission. */
const editPermission = (key: string): Permission => (key === "alerts" ? "settings.edit" : "content.edit");
const publishPermission = (key: string): Permission => (key === "alerts" ? "settings.edit" : "content.publish");

// GET /api/admin/cms/content/home — what the editor should show.
export async function GET(_req: NextRequest, { params }: { params: { key: string } }) {
  if (!isSectionKey(params.key)) return adminJson({ error: "Unknown section." }, { status: 404 });
  const staff = await requireStaff(params.key === "alerts" ? "settings.edit" : "content.view");
  if (staff instanceof NextResponse) return staff;
  return adminJson(await getEditorState(params.key));
}

// PUT — save a draft. Nothing changes on the public website.
export async function PUT(req: NextRequest, { params }: { params: { key: string } }) {
  if (!isSectionKey(params.key)) return adminJson({ error: "Unknown section." }, { status: 404 });
  const staff = await requireStaff(editPermission(params.key), req);
  if (staff instanceof NextResponse) return staff;
  const body = await req.json().catch(() => null);
  if (!body || typeof body.data !== "object") return adminJson({ error: "Nothing to save." }, { status: 400 });
  await saveDraft(params.key, body.data, staff.id);
  await writeAudit(staff.id, "website_draft_saved", "website", params.key);
  return adminJson(await getEditorState(params.key));
}

// POST { action: "publish", data } | { action: "restore" }
export async function POST(req: NextRequest, { params }: { params: { key: string } }) {
  if (!isSectionKey(params.key)) return adminJson({ error: "Unknown section." }, { status: 404 });
  const staff = await requireStaff(publishPermission(params.key), req);
  if (staff instanceof NextResponse) return staff;
  const body = await req.json().catch(() => null);

  if (body?.action === "publish") {
    if (typeof body.data !== "object" || !body.data) return adminJson({ error: "Nothing to publish." }, { status: 400 });
    await publish(params.key, body.data, staff.id);
    await writeAudit(staff.id, "website_published", "website", params.key);
    return adminJson(await getEditorState(params.key));
  }
  if (body?.action === "restore") {
    await restoreOriginal(params.key);
    await writeAudit(staff.id, "website_restored_original", "website", params.key);
    return adminJson(await getEditorState(params.key));
  }
  return adminJson({ error: "Unknown action." }, { status: 400 });
}
