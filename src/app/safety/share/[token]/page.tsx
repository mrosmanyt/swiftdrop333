import SharedLocationView from "@/components/SharedLocationView";

/**
 * Public "watch a courier's live location" page — no login, the token in
 * the URL is the access control (same trust model as the customer track
 * link). All the actual data fetching happens client-side on a poll, same
 * pattern as /track/[orderId], so this stays a thin wrapper.
 */
export default function SafetySharePage({ params }: { params: { token: string } }) {
  return (
    <div className="min-h-screen bg-bg px-4 py-10 text-fg">
      <div className="mx-auto max-w-lg">
        <h1 className="text-xl font-semibold">Live location</h1>
        <p className="mt-1 text-sm text-fg-muted">Shared with you by a SwiftDrop courier.</p>
        <div className="mt-5">
          <SharedLocationView token={params.token} />
        </div>
      </div>
    </div>
  );
}
