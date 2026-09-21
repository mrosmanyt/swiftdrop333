"use client";

import { useEffect, useState } from "react";
import { ORDER_STATUS_LABEL, OrderStatus, estimateEtaMinutes, haversineKm } from "@/lib/types";
import LiveMap, { MapMarker } from "./LiveMap";
import RatingForm from "./RatingForm";

const STEPS: OrderStatus[] = ["PENDING", "ASSIGNED", "PICKED_UP", "IN_TRANSIT", "DELIVERED"];

interface OrderData {
  id: string;
  status: OrderStatus;
  merchantBusinessName: string;
  customerName: string;
  pickupAddress: string;
  pickupLat: number | null;
  pickupLng: number | null;
  dropoffAddress: string;
  dropoffLat: number | null;
  dropoffLng: number | null;
  courierEmail: string | null;
  courierVehicleType: string | null;
  proofOfDeliveryUrl: string | null;
  customerRating: number | null;
}

/**
 * Live tracking view: polls GET /api/orders/:id every 4s so the status
 * timeline and the courier's position on the map move in near real time —
 * this is the "customer sees driver live" requirement. No login, no
 * WebSocket server required; the order id itself is the access key, same
 * as a real Trexity tracking link.
 */
export default function TrackingLive({
  orderId,
  initialOrder,
  showRating = true,
}: {
  orderId: string;
  initialOrder: OrderData;
  showRating?: boolean;
}) {
  const [order, setOrder] = useState<OrderData>(initialOrder);
  const [courierLoc, setCourierLoc] = useState<{ lat: number; lng: number; at: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      const res = await fetch(`/api/orders/${orderId}`, { cache: "no-store" });
      if (!res.ok || cancelled) return;
      const data = await res.json();
      setOrder(data.order);
      setCourierLoc(data.courierLocation);
    }
    poll();
    const id = setInterval(poll, 4000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [orderId]);

  const currentStepIndex = STEPS.indexOf(order.status);
  const isActive = ["ASSIGNED", "PICKED_UP", "IN_TRANSIT"].includes(order.status);

  const markers: MapMarker[] = [];
  if (order.pickupLat && order.pickupLng) {
    markers.push({ id: "pickup", lat: order.pickupLat, lng: order.pickupLng, label: "Pickup", kind: "pickup" });
  }
  if (order.dropoffLat && order.dropoffLng) {
    markers.push({ id: "dropoff", lat: order.dropoffLat, lng: order.dropoffLng, label: "Delivery address", kind: "dropoff" });
  }
  if (courierLoc) {
    markers.push({ id: "courier", lat: courierLoc.lat, lng: courierLoc.lng, label: "Your courier", kind: "courier" });
  }

  const eta =
    courierLoc && order.dropoffLat && order.dropoffLng
      ? estimateEtaMinutes(
          haversineKm(courierLoc.lat, courierLoc.lng, order.dropoffLat, order.dropoffLng),
          order.courierVehicleType
        )
      : null;

  return (
    <div className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-xl font-bold">{order.merchantBusinessName}</h1>
      <p className="text-gray-500">Delivery to {order.customerName}</p>

      {isActive && markers.length > 0 && (
        <div className="mt-4">
          <LiveMap markers={markers} height={260} />
          {eta !== null && (
            <p className="mt-2 text-sm text-gray-500">
              Estimated arrival: <span className="font-medium text-brand">~{eta} min</span>
            </p>
          )}
          {!courierLoc && (
            <p className="mt-2 text-xs text-gray-400">Waiting for your courier's location…</p>
          )}
        </div>
      )}

      <div className="mt-8 space-y-4">
        {STEPS.map((step, i) => (
          <div key={step} className="flex items-center gap-3">
            <span className={`h-3 w-3 rounded-full ${i <= currentStepIndex ? "bg-brand" : "bg-gray-200"}`} />
            <span className={i <= currentStepIndex ? "font-medium" : "text-gray-400"}>
              {ORDER_STATUS_LABEL[step]}
            </span>
          </div>
        ))}
      </div>

      {order.courierEmail && (
        <p className="mt-6 text-sm text-gray-500">
          Your courier: {order.courierEmail} · {order.courierVehicleType}
        </p>
      )}

      {order.status === "DELIVERED" && order.proofOfDeliveryUrl && (
        <div className="mt-6">
          <p className="text-sm font-medium">Proof of delivery</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={order.proofOfDeliveryUrl}
            alt="Proof of delivery"
            className="mt-2 rounded-lg border border-gray-200"
          />
        </div>
      )}

      {showRating && order.status === "DELIVERED" && order.customerRating == null && (
        <RatingForm orderId={order.id} />
      )}
      {order.status === "DELIVERED" && order.customerRating != null && (
        <p className="mt-6 text-sm text-gray-500">Customer rated this delivery {order.customerRating}★. Thanks!</p>
      )}
    </div>
  );
}
