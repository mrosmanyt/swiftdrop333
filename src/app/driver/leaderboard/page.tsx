import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { getCourierProfileByUserId, weeklyLeaderboard, courierWeeklyRank } from "@/lib/repo";

const MEDALS = ["🥇", "🥈", "🥉"];

export default async function DriverLeaderboardPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "COURIER") redirect("/login");

  const courier = getCourierProfileByUserId(user.id);
  if (!courier) return <p>No courier profile found.</p>;

  const board = weeklyLeaderboard(20);
  const mine = courierWeeklyRank(courier.id);
  const onBoard = board.some((r) => r.courierId === courier.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <p className="mt-1 text-sm text-fg-muted">Most deliveries in the last 7 days. Resets on a rolling basis.</p>
      </div>

      <div className={`rounded-xl border p-4 ${mine.rank && mine.rank <= 3 ? "border-warn/30 bg-warn-soft" : "border-line bg-surface"}`}>
        <p className="text-sm text-fg-subtle">Your rank this week</p>
        <p className="mt-1 text-xl font-semibold">
          {mine.rank ? `#${mine.rank}` : "Unranked yet"}
          {mine.rank ? <span className="ml-2 text-sm font-normal text-fg-muted">of {mine.total}</span> : null}
        </p>
        <p className="mt-1 text-xs text-fg-subtle">
          {mine.deliveries} deliver{mine.deliveries === 1 ? "y" : "ies"} · ${(mine.earnedCents / 100).toFixed(2)} earned
        </p>
      </div>

      <div className="rounded-xl border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="text-fg-subtle">
            <tr>
              <th className="p-3">#</th>
              <th className="p-3">Courier</th>
              <th className="p-3">Tier</th>
              <th className="p-3">Rating</th>
              <th className="p-3 text-right">Deliveries</th>
              <th className="p-3 text-right">Earned</th>
            </tr>
          </thead>
          <tbody>
            {board.map((row, i) => {
              const isMe = row.courierId === courier.id;
              return (
                <tr key={row.courierId} className={`border-t border-line ${isMe ? "bg-accent/5" : ""}`}>
                  <td className="p-3 font-medium">{MEDALS[i] ?? `#${i + 1}`}</td>
                  <td className="p-3">
                    {row.name}
                    {isMe && <span className="ml-1.5 text-xs text-accent">(you)</span>}
                  </td>
                  <td className="p-3 text-xs text-fg-muted">{row.tier}</td>
                  <td className="p-3 text-xs">{row.rating ? `${row.rating.toFixed(1)}★` : "—"}</td>
                  <td className="p-3 text-right">{row.deliveries}</td>
                  <td className="p-3 text-right">${(row.earnedCents / 100).toFixed(2)}</td>
                </tr>
              );
            })}
            {!board.length && (
              <tr>
                <td className="p-3 text-fg-subtle" colSpan={6}>
                  No deliveries yet this week — be the first on the board.
                </td>
              </tr>
            )}
            {!onBoard && mine.rank && (
              <tr className="border-t-2 border-accent/30 bg-accent/5">
                <td className="p-3 font-medium">#{mine.rank}</td>
                <td className="p-3">You</td>
                <td className="p-3 text-xs text-fg-muted">{courier.tier}</td>
                <td className="p-3 text-xs">{courier.rating ? `${courier.rating.toFixed(1)}★` : "—"}</td>
                <td className="p-3 text-right">{mine.deliveries}</td>
                <td className="p-3 text-right">${(mine.earnedCents / 100).toFixed(2)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
