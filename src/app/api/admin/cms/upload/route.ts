import { NextRequest, NextResponse } from "next/server";
import { writeAudit } from "@/lib/repo";
import { hit } from "@/lib/rateLimit";
import { adminJson, requireStaff } from "@/lib/cms/staff";
import { MAX_MEDIA_BYTES, saveCmsImage } from "@/lib/cms/media";

export const dynamic = "force-dynamic";

// POST (multipart, field "file") — upload one picture for the website editor.
// The editor shrinks pictures in the browser first; this checks the real
// file type and size again on the server.
export async function POST(req: NextRequest) {
  const staff = await requireStaff("content.edit", req);
  if (staff instanceof NextResponse) return staff;
  if (!hit(`cms-upload:${staff.id}`, 40, 10 * 60 * 1000).ok) {
    return adminJson({ error: "Too many uploads — wait a few minutes." }, { status: 429 });
  }
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || typeof file === "string") return adminJson({ error: "Choose a picture first." }, { status: 400 });
  if (file.size > MAX_MEDIA_BYTES) return adminJson({ error: "That picture is too large (2 MB maximum)." }, { status: 413 });
  const result = await saveCmsImage(Buffer.from(await file.arrayBuffer()), staff.id);
  if ("error" in result) return adminJson({ error: result.error }, { status: 400 });
  await writeAudit(staff.id, "website_picture_uploaded", "website", result.url);
  return adminJson(result);
}
