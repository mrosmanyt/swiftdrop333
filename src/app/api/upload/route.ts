import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { savePodPhoto, sniffType } from "@/lib/storage";
import { hit } from "@/lib/rateLimit";

const MAX_BYTES = 8 * 1024 * 1024; // 8MB

/**
 * POST /api/upload — courier-only proof-of-delivery photo upload.
 *
 * The file type is decided from the file's own bytes (not the browser's
 * claim), EXIF/GPS metadata is stripped, and the photo is stored on the
 * persistent volume — see src/lib/storage.ts. The returned URL is served by
 * GET /api/pod/:name.
 */
export async function POST(req: NextRequest) {
  const auth = await requireRole("COURIER");
  if (auth instanceof NextResponse) return auth;

  if (!hit(`upload:pod:${auth.id}`, 60, 60 * 60 * 1000).ok) {
    return NextResponse.json({ error: "Too many uploads — try again later." }, { status: 429 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 8MB)" }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const type = sniffType(bytes);
  if (type !== "jpeg" && type !== "png" && type !== "webp") {
    return NextResponse.json({ error: "Upload a JPG, PNG or WEBP photo" }, { status: 400 });
  }

  const url = await savePodPhoto(bytes, type);
  return NextResponse.json({ url }, { status: 201 });
}
