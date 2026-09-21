import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import {
  getCourierProfileByUserId,
  listActiveOffersForCourier,
  listActiveOrdersForCourier,
  listPendingOrders,
} from "@/lib/repo";
import { courierBlockReason } from "@/lib/guards";
import OfferCard from "@/components/OfferCard";
import ActiveDeliveryCard from "@/components/ActiveDeliveryCard";
import AutoRefresh from "@/components/AutoRefresh";
import DispatchTicker from "@/components/DispatchTicker";

export default async function DriverOffersPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "COURIER") redirect("/login");

  const courier = getCourierProfileByUserId(user.id);
  const blockReason = courierBlockReason(courier);

  if (blockReason) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold">Offers</h1>
        <div className="rounded-xl border border-warn/30 bg-warn-soft p-4 text-sm text-warn">
          <p className="font-medium">Not available yet</p>
          <p className="mt-1">{blockReason}</p>
          <a href="/driver/documents" className="mt-2 inline-block font-medium text-accent hover:underline">
            Go to your documents →
          </a>
        </div>
      </div>
    );
  }

  const activeOrders = listActiveOrdersForCourier(courier!.id);
  const myOffers = listActiveOffersForCourier(courier!.id);
  // Orders nobody nearby accepted — open to any online courier.
  const broadcastOrders = listPendingOrders(20).filter((o) => o!.dispatchMode === "broadcast");

  return (
    <div className="space-y-8">
      <AutoRefresh intervalMs={5000} />
      <DispatchTicker intervalMs={8000} />

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-xl font-bold">My active deliveries</h1>
          <TierBadge tier={courier!.tier} />
        </div>
        <div className="space-y-3">
          {activeOrders.map((o) => (
            <ActiveDeliveryCard key={o!.id} order={o as any} />
          ))}
          {!activeOrders.length && (
            <p className="text-sm text-fg-subtle">No active deliveries — accept an offer below.</p>
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">
          Offers for you {myOffers.length > 0 && <span className="text-accent">({myOffers.length})</span>}
        </h2>
        <div className="space-y-3">
          {myOffers.map((o: any) => (
            <OfferCard
              key={o.offerId}
              orderId={o.id}
              offerId={o.offerId}
              expiresAt={o.offerExpiresAt}
              zoneName={o.zoneName ?? "Delivery"}
              pickupAddress={o.pickupAddress}
              dropoffAddress={o.dropoffAddress}
              serviceType={o.serviceType}
              courierFeeCents={o.courierFeeCents}
              distanceKm={o.distanceKm}
              windowEnd={o.windowEnd}
            />
          ))}
          {!myOffers.length && (
            <p className="text-sm text-fg-subtle">
              Nothing offered right now — stay online and the next nearby delivery comes to you.
            </p>
          )}
        </div>
      </div>

      {broadcastOrders.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">Open deliveries</h2>
          <p className="mb-2 text-xs text-fg-subtle">
            These weren&apos;t picked up by anyone nearby — first to accept gets them.
          </p>
          <div className="space-y-3">
            {broadcastOrders.map((o) => (
              <OfferCard
                key={o!.id}
                orderId={o!.id}
                broadcast
                zoneName={o!.zoneName ?? "Delivery"}
                pickupAddress={o!.pickupAddress}
                dropoffAddress={o!.dropoffAddress}
                serviceType={o!.serviceType}
                courierFeeCents={o!.courierFeeCents}
                distanceKm={o!.distanceKm}
                windowEnd={o!.windowEnd}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const colors: Record<string, string> = {
    STARTER: "bg-surface-2 text-fg-muted",
    SILVER: "bg-fg/10 text-fg-muted",
    GOLD: "bg-warn-soft text-warn",
    PRO: "bg-accent/10 text-accent",
  };
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${colors[tier]}`}>
      {tier === "PRO" ? "⭐ SwiftDrop Pro" : tier}
    </span>
  );
}
