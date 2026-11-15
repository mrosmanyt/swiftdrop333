import { NextRequest, NextResponse } from "next/server";
import { readCmsImage } from "@/lib/cms/media";

// GET /api/cms/media/<uuid>.<ext> — a picture uploaded in the website editor.
// File names are random and never reused, so they can be cached for a long time.
export async function GET(_req: NextRequest, { params }: { params: { name: string } }) {
  const file = await readCmsImage(params.name).catch(() => null);
  if (!file) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(new Uint8Array(file.bytes), {
    headers: {
      "Content-Type": file.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
