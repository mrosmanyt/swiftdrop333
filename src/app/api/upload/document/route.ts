import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { getSessionUser } from "@/lib/session";
import {
  addDocument,
  getCourierProfileByUserId,
  getMerchantProfileByUserId,
  updateCourierDocUrl,
} from "@/lib/repo";

const UPLOAD_DIR = path.join(process.cwd(), "private-uploads");
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_BYTES = 10 * 1024 * 1024; // 10MB

const COURIER_DOC_TYPES = ["drivers_license", "insurance", "vehicle_registration"] as const;
const MERCHANT_DOC_TYPES = ["business_licence", "void_cheque", "id"] as const;

/**
 * POST /api/upload/document — onboarding document upload (licence,
 * insurance, business licence...).
 *
 * These are identity documents, so unlike proof-of-delivery photos they do
 * NOT go in /public. They're written to /private-uploads and served only to
 * admins through GET /api/admin/documents/:id.
 */
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  const docType = String(form.get("docType") ?? "");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Upload a JPG, PNG, WEBP or PDF" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
  }

  let ownerType: "courier" | "merchant";
  let ownerId: string;

  if (user.role === "COURIER") {
    const courier = getCourierProfileByUserId(user.id);
    if (!courier) return NextResponse.json({ error: "No courier profile" }, { status: 400 });
    if (!COURIER_DOC_TYPES.includes(docType as any)) {
      return NextResponse.json({ error: "Unknown document type" }, { status: 400 });
    }
    ownerType = "courier";
    ownerId = courier.id;
  } else if (user.role === "MERCHANT") {
    const merchant = getMerchantProfileByUserId(user.id);
    if (!merchant) return NextResponse.json({ error: "No merchant profile" }, { status: 400 });
    if (!MERCHANT_DOC_TYPES.includes(docType as any)) {
      return NextResponse.json({ error: "Unknown document type" }, { status: 400 });
    }
    ownerType = "merchant";
    ownerId = merchant.id;
  } else {
    return NextResponse.json({ error: "Admins don't upload onboarding documents" }, { status: 403 });
  }

  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const ext = file.type === "application/pdf" ? "pdf" : file.type.split("/")[1];
  const filename = `${randomUUID()}.${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, filename), Buffer.from(await file.arrayBuffer()));

  const docId = addDocument({
    ownerType,
    ownerId,
    docType,
    url: filename, // stored as a bare filename; only served via the admin route
    originalName: file.name,
  });

  // Keep the convenience pointers on the courier profile in sync.
  if (ownerType === "courier") {
    if (docType === "drivers_license") updateCourierDocUrl(ownerId, "license_doc_url", filename);
    if (docType === "insurance") updateCourierDocUrl(ownerId, "insurance_doc_url", filename);
  }

  return NextResponse.json({ ok: true, docId }, { status: 201 });
}
