import {
  createOrder,
  getOrderById,
  getZoneById,
  recordWebhookDelivery,
  webhookUrlsForMerchant,
} from "@/lib/repo";
import { computeOrderPrice, ServiceType } from "@/lib/pricing";
import { routeBetween } from "@/lib/geo";
import { runDispatchTick } from "@/lib/dispatch";
import { notifyOrderCreated } from "@/lib/notify";

/**
 * One place where an order gets created, priced, dispatched and announced —
 * shared by the merchant portal, CSV import, the public merchant API and
 * the recurring-order generator, so all four behave identically.
 */

export interface CreateOrderRequest {
  merchantId: string;
  zoneId: string;
  pickupAddress: string;
  pickupLat?: number | null;
  pickupLng?: number | null;
  dropoffAddress: string;
  dropoffLat?: number | null;
  dropoffLng?: number | null;
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  deliveryInstructions?: string | null;
  packageWeightKg?: number | null;
  serviceType: ServiceType;
  windowStart?: string | null;
  windowEnd?: string | null;
  source?: "portal" | "csv" | "api" | "recurring";
}

export async function createAndDispatchOrder(input: CreateOrderRequest) {
  const zone = getZoneById(input.zoneId);
  if (!zone || !zone.isActive) throw new Error("Unknown or inactive zone");

  let distanceKm = 3;
  let distanceSource = "flat-estimate";
  let etaMinutes: number | null = null;

  if (input.pickupLat && input.pickupLng && input.dropoffLat && input.dropoffLng) {
    const route = await routeBetween(
      { lat: input.pickupLat, lng: input.pickupLng },
      { lat: input.dropoffLat, lng: input.dropoffLng }
    );
    distanceKm = route.distanceKm;
    distanceSource = route.source;
    etaMinutes = route.durationMin;
  }

  const { priceCents, courierFeeCents, platformFeeCents } = computeOrderPrice({
    baseRateCents: zone.baseRateCents,
    perKmCents: zone.perKmCents,
    distanceKm,
    serviceType: input.serviceType,
    surgeMultiplier: zone.surgeMultiplier,
  });

  const orderId = createOrder({
    ...input,
    priceCents,
    courierFeeCents,
    platformFeeCents,
    distanceKm,
    distanceSource,
    etaMinutes,
  } as any);

  // Record surge + source on the order for reporting.
  const { db } = await import("@/lib/db");
  db.prepare(`UPDATE orders SET surge_multiplier = ?, source = ? WHERE id = ?`).run(
    zone.surgeMultiplier ?? 1,
    input.source ?? "portal",
    orderId
  );

  const order = getOrderById(orderId);
  if (order) {
    await notifyOrderCreated(order as any);
    await fireWebhooks(input.merchantId, "order.created", order);
  }
  runDispatchTick();

  return { orderId, priceCents, courierFeeCents, distanceKm, surgeMultiplier: zone.surgeMultiplier };
}

/**
 * Push an event to every webhook URL the merchant has registered.
 * Failures are recorded, never thrown — a merchant's broken endpoint must
 * not break their delivery.
 */
export async function fireWebhooks(merchantId: string, event: string, order: any) {
  const urls = webhookUrlsForMerchant(merchantId);
  if (!urls.length) return;

  const payload = JSON.stringify({
    event,
    sentAt: new Date().toISOString(),
    order: {
      id: order.id,
      status: order.status,
      customerName: order.customerName,
      dropoffAddress: order.dropoffAddress,
      priceCents: order.priceCents,
      trackingUrl: `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/track/${order.id}`,
    },
  });

  await Promise.all(
    urls.map(async (url) => {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-SwiftDrop-Event": event },
          body: payload,
          signal: controller.signal,
        }).finally(() => clearTimeout(timer));

        recordWebhookDelivery({
          merchantId,
          orderId: order.id,
          event,
          url,
          status: res.ok ? "delivered" : "failed",
          responseCode: res.status,
        });
      } catch (e: any) {
        recordWebhookDelivery({
          merchantId,
          orderId: order.id,
          event,
          url,
          status: "failed",
          error: String(e?.message ?? e),
        });
      }
    })
  );
}

/** Minimal CSV parser (handles quoted fields) — no dependency needed. */
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch !== "\r") field += ch;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }

  const [header, ...body] = rows.filter((r) => r.some((c) => c.trim() !== ""));
  if (!header) return [];
  return body.map((r) => {
    const obj: Record<string, string> = {};
    header.forEach((h, i) => (obj[h.trim()] = (r[i] ?? "").trim()));
    return obj;
  });
}
