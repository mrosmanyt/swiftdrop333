import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { saveDocument, sniffType } from "@/lib/storage";
import { hit } from "@/lib/rateLimit";
import {
  addDocument,
  getCourierProfileByUserId,
  getMerchantProfileByUserId,
  updateCourierDocUrl,
} from "@/lib/repo";

const MAX_BYTES = 10 * 1024 * 1024; // 10MB

const COURIER_DOC_TYPES = ["drivers_license", "insurance", "vehicle_registration"] as const;
// Deliberately NO "void_cheque" and NO personal photo ID for merchants: a
// void cheque carries bank institution/transit/account numbers, and the
// platform has no reason to hold either. Bank details for payouts belong
// with a payment provider (e.g. Stripe Connect), never in this database.
const MERCHANT_DOC_TYPES = ["business_licence"] as const;

/**
 * POST /api/upload/document — onboarding document upload (licence,
 * insurance, business licence...).
 *
 * These are identity documents: they're encrypted (AES-256-GCM) before
 * being written to the persistent volume, served only to admins through
 * GET /api/admin/documents/:id, and the file is deleted automatically a
 * short while after the application is reviewed (see lib/retention.ts).
 */
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  const docType = String(form.get("docType") ?? "");

  if (!hit(`upload:doc:${user.id}`, 20, 60 * 60 * 1000).ok) {
    return NextResponse.json({ error: "Too many uploads — try again later." }, { status: 429 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
  }

  let ownerType: "courier" | "merchant";
  let ownerId: string;

  if (user.role === "COURIER") {
    const courier = await getCourierProfileByUserId(user.id);
    if (!courier) return NextResponse.json({ error: "No courier profile" }, { status: 400 });
    if (!COURIER_DOC_TYPES.includes(docType as any)) {
      return NextResponse.json({ error: "Unknown document type" }, { status: 400 });
    }
    ownerType = "courier";
    ownerId = courier.id;
  } else if (user.role === "MERCHANT") {
    const merchant = await getMerchantProfileByUserId(user.id);
    if (!merchant) return NextResponse.json({ error: "No merchant profile" }, { status: 400 });
    if (!MERCHANT_DOC_TYPES.includes(docType as any)) {
      return NextResponse.json({ error: "Unknown document type" }, { status: 400 });
    }
    ownerType = "merchant";
    ownerId = merchant.id;
  } else {
    return NextResponse.json({ error: "Admins don't upload onboarding documents" }, { status: 403 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const type = sniffType(bytes);
  if (!type) {
    return NextResponse.json({ error: "Upload a JPG, PNG, WEBP or PDF" }, { status: 400 });
  }
  const filename = await saveDocument(bytes, type);

  const docId = await addDocument({
    ownerType,
    ownerId,
    docType,
    url: filename, // stored as a bare filename; only served via the admin route
    // The original file name is not kept — phone/scan file names often
    // contain the person's name or licence number.
    originalName: `${docType}.${type}`,
  });

  // Keep the convenience pointers on the courier profile in sync.
  if (ownerType === "courier") {
    if (docType === "drivers_license") await updateCourierDocUrl(ownerId, "license_doc_url", filename);
    if (docType === "insurance") await updateCourierDocUrl(ownerId, "insurance_doc_url", filename);
  }

  return NextResponse.json({ ok: true, docId }, { status: 201 });
}
