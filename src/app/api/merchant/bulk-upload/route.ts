import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { getMerchantProfileByUserId, listActiveZones } from "@/lib/repo";
import { merchantBlockReason } from "@/lib/guards";
import { createAndDispatchOrder, parseCsv } from "@/lib/orders";
import { searchAddress } from "@/lib/geo";

/**
 * POST /api/merchant/bulk-upload — create many deliveries from one CSV.
 *
 * Expected columns (header row required):
 *   customerName, dropoffAddress, customerPhone, customerEmail,
 *   deliveryInstructions, serviceType, pickupAddress
 *
 * Rows are validated individually: a bad row is reported back with its
 * line number and the rest still go through, because a merchant uploading
 * 50 orders shouldn't lose 49 of them to one typo.
 */
export async function POST(req: NextRequest) {
  const auth = await requireRole("MERCHANT");
  if (auth instanceof NextResponse) return auth;

  const merchant = getMerchantProfileByUserId(auth.id);
  const blocked = merchantBlockReason(merchant);
  if (blocked) return NextResponse.json({ error: blocked }, { status: 403 });

  const form = await req.formData();
  const file = form.get("file");
  const zoneId = String(form.get("zoneId") ?? "") || listActiveZones()[0]?.id;
  const defaultPickup = String(form.get("pickupAddress") ?? "") || merchant!.businessAddress || "";
  const geocode = String(form.get("geocode") ?? "true") === "true";

  if (!(file instanceof File)) return NextResponse.json({ error: "No CSV uploaded" }, { status: 400 });
  if (!zoneId) return NextResponse.json({ error: "No active delivery zones" }, { status: 400 });

  const rows = parseCsv(await file.text());
  if (!rows.length) return NextResponse.json({ error: "CSV appears to be empty" }, { status: 400 });
  if (rows.length > 200) {
    return NextResponse.json({ error: "Max 200 rows per upload" }, { status: 400 });
  }

  const created: string[] = [];
  const failed: { line: number; reason: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const line = i + 2; // +1 for header, +1 for 1-indexing
    const customerName = row.customerName || row.customer || "";
    const dropoffAddress = row.dropoffAddress || row.address || "";
    const pickupAddress = row.pickupAddress || defaultPickup;

    if (!customerName || !dropoffAddress) {
      failed.push({ line, reason: "customerName and dropoffAddress are required" });
      continue;
    }
    if (!pickupAddress) {
      failed.push({ line, reason: "no pickup address (set one on the form or per row)" });
      continue;
    }

    // Best-effort geocoding so batching and distance pricing work; a row
    // without coordinates still gets created at zone rate.
    let dropLat: number | undefined;
    let dropLng: number | undefined;
    if (geocode) {
      const { suggestions } = await searchAddress(dropoffAddress);
      if (suggestions[0]) {
        dropLat = suggestions[0].lat;
        dropLng = suggestions[0].lng;
      }
    }

    try {
      const result = await createAndDispatchOrder({
        merchantId: merchant!.id,
        zoneId,
        pickupAddress,
        dropoffAddress,
        dropoffLat: dropLat,
        dropoffLng: dropLng,
        customerName,
        customerPhone: row.customerPhone || null,
        customerEmail: row.customerEmail || null,
        deliveryInstructions: row.deliveryInstructions || null,
        serviceType: (row.serviceType as any) || "SAME_DAY",
        source: "csv",
      });
      created.push(result.orderId);
    } catch (e: any) {
      failed.push({ line, reason: String(e?.message ?? e) });
    }
  }

  return NextResponse.json({ createdCount: created.length, created, failed }, { status: 201 });
}
