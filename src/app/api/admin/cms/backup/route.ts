import { NextRequest, NextResponse } from "next/server";
import { writeAudit } from "@/lib/repo";
import { adminJson, requireStaff } from "@/lib/cms/staff";
import { exportContent, importContent } from "@/lib/cms/content";
import { allEnquiriesForBackup } from "@/lib/cms/enquiries";

export const dynamic = "force-dynamic";

// GET — download every piece of website content and all enquiries as one file.
export async function GET() {
  const staff = await requireStaff("backup.manage");
  if (staff instanceof NextResponse) return staff;
  const backup = {
    app: "swiftdrop-website",
    version: 1,
    createdAt: new Date().toISOString(),
    content: await exportContent(),
    enquiries: await allEnquiriesForBackup(),
  };
  await writeAudit(staff.id, "website_backup_downloaded", "website");
  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="swiftdrop-website-backup-${backup.createdAt.slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}

// POST — restore website CONTENT from a backup file. Enquiries are never
// overwritten by a restore; they stay exactly as they are.
export async function POST(req: NextRequest) {
  const staff = await requireStaff("backup.manage", req);
  if (staff instanceof NextResponse) return staff;
  const text = await req.text();
  if (text.length > 5_000_000) return adminJson({ error: "That file is too large to be a backup." }, { status: 413 });
  let body: any;
  try {
    body = JSON.parse(text);
  } catch {
    return adminJson({ error: "That file is not a valid backup." }, { status: 400 });
  }
  if (body?.app !== "swiftdrop-website" || typeof body.content !== "object") {
    return adminJson({ error: "That file is not a SwiftDrop website backup." }, { status: 400 });
  }
  try {
    const restored = await importContent(body.content, staff.id);
    await writeAudit(staff.id, "website_backup_restored", "website", undefined, `${restored.length} sections`);
    return adminJson({ ok: true, restored });
  } catch (e: any) {
    return adminJson({ error: String(e?.message ?? "The backup could not be restored.") }, { status: 400 });
  }
}
