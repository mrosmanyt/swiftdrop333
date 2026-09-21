import { listActiveRecurringOrders, markRecurringGenerated } from "@/lib/repo";
import { createAndDispatchOrder } from "@/lib/orders";

/**
 * Materialise today's deliveries from standing schedules.
 *
 * Idempotent: each schedule records the last date it generated for, so
 * calling this repeatedly in a day creates nothing extra. Triggered when
 * the merchant opens their recurring page and from the dispatch tick; in
 * production, also call it from a daily cron.
 */
export async function generateDueRecurringOrders(now = new Date()) {
  const todayKey = now.toISOString().slice(0, 10);
  const weekday = now.getDay(); // 0 = Sunday

  const schedules = listActiveRecurringOrders();
  const created: string[] = [];

  for (const s of schedules) {
    if (s.last_generated_date === todayKey) continue;

    const days = String(s.days_of_week)
      .split(",")
      .map((d: string) => Number(d.trim()))
      .filter((d: number) => !Number.isNaN(d));
    if (!days.includes(weekday)) continue;

    let windowStart: string | null = null;
    let windowEnd: string | null = null;
    if (s.window_hour_start != null && s.window_hour_end != null) {
      const start = new Date(now);
      start.setHours(s.window_hour_start, 0, 0, 0);
      const end = new Date(now);
      end.setHours(s.window_hour_end, 0, 0, 0);
      windowStart = start.toISOString();
      windowEnd = end.toISOString();
    }

    try {
      const result = await createAndDispatchOrder({
        merchantId: s.merchant_id,
        zoneId: s.zone_id,
        pickupAddress: s.pickup_address,
        pickupLat: s.pickup_lat,
        pickupLng: s.pickup_lng,
        dropoffAddress: s.dropoff_address,
        dropoffLat: s.dropoff_lat,
        dropoffLng: s.dropoff_lng,
        customerName: s.customer_name,
        customerPhone: s.customer_phone,
        customerEmail: s.customer_email,
        deliveryInstructions: s.delivery_instructions,
        serviceType: s.service_type,
        windowStart,
        windowEnd,
        source: "recurring",
      });
      created.push(result.orderId);
      markRecurringGenerated(s.id, todayKey);
    } catch {
      // A broken schedule (deleted zone, say) must not stop the others.
      markRecurringGenerated(s.id, todayKey);
    }
  }

  return { generated: created.length, orderIds: created };
}
