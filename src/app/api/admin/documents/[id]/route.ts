import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { getDocumentById, writeAudit } from "@/lib/repo";
import { readDocument, safeDownloadName } from "@/lib/storage";

/**
 * GET /api/admin/documents/:id — streams an onboarding document to an
 * admin reviewing an application. Documents are stored encrypted and are
 * never served from /public, so this route is the only way to view them.
 * Every view is written to the audit log.
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const doc = await getDocumentById(params.id);
  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  const file = doc.url ? await readDocument(doc.url) : null;
  if (!file) {
    return NextResponse.json(
      { error: "This file is no longer stored (deleted after review, or lost in an old redeploy)." },
      { status: 404 }
    );
  }

  await writeAudit(auth.id, "document_viewed", "document", doc.id, doc.docType);

  return new NextResponse(new Uint8Array(file.bytes), {
    headers: {
      "Content-Type": file.mime,
      "Content-Disposition": `inline; filename="${safeDownloadName(doc.originalName, "document")}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
