export type OrderStatus =
  | "PENDING"
  | "ASSIGNED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "FAILED"
  | "RETURNING"
  | "RETURNED"
  | "CANCELLED";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Order placed",
  ASSIGNED: "Courier assigned",
  PICKED_UP: "Picked up",
  IN_TRANSIT: "In transit",
  DELIVERED: "Delivered",
  FAILED: "Delivery failed",
  RETURNING: "Returning to sender",
  RETURNED: "Returned to sender",
  CANCELLED: "Cancelled",
};

/** Straight-line ETA estimate — good enough until real road-routing (Maps API) is wired in. */
export function estimateEtaMinutes(distanceKm: number, vehicleType?: string | null) {
  const avgSpeedKmh = vehicleType === "BIKE" ? 18 : vehicleType === "SCOOTER" ? 30 : 35;
  return Math.max(1, Math.round((distanceKm / avgSpeedKmh) * 60));
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}
