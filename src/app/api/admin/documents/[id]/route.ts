import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { requireRole } from "@/lib/session";
import { getDocumentById } from "@/lib/repo";

const UPLOAD_DIR = path.join(process.cwd(), "private-uploads");

const MIME: Record<string, string> = {
  pdf: "application/pdf",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/**
 * GET /api/admin/documents/:id — streams an onboarding document to an
 * admin reviewing an application. Identity documents are never served from
 * /public, so this route is the only way to view them.
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const doc = getDocumentById(params.id);
  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  // `url` is a generated filename, never user input — but normalise anyway
  // so a crafted value can't escape the uploads directory.
  const safeName = path.basename(doc.url);
  const filePath = path.join(UPLOAD_DIR, safeName);
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "File missing on disk" }, { status: 404 });
  }

  const ext = safeName.split(".").pop() ?? "";
  const body = fs.readFileSync(filePath);

  return new NextResponse(body, {
    headers: {
      "Content-Type": MIME[ext] ?? "application/octet-stream",
      "Content-Disposition": `inline; filename="${doc.originalName ?? safeName}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
