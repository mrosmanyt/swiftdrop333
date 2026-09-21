"use client";

import { useEffect, useState } from "react";
import { Card, EmptyState, PageHeader, Stat } from "@/components/portal/ui";

interface LoyaltyAccount {
  points: number;
  referralCode: string;
}

interface Transaction {
  id: string;
  points: number;
  reason: string;
  createdAt: string;
}

const REASON_LABEL: Record<string, string> = {
  order_delivered: "Delivery reward",
  referral_bonus: "Referral bonus — a friend joined",
  referred_signup_bonus: "Welcome bonus — joined with a referral code",
  redeemed: "Redeemed",
};

export default function CustomerLoyaltyPage() {
  const [account, setAccount] = useState<LoyaltyAccount | null>(null);
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/customer/loyalty")
      .then((r) => r.json())
      .then((data) => {
        setAccount(data.account);
        setTransactions(data.transactions ?? []);
      });
  }, []);

  const referralLink =
    typeof window !== "undefined" && account
      ? `${window.location.origin}/signup/customer?ref=${account.referralCode}`
      : "";

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can fail (permissions, insecure context) — the
      // code is still shown on the page, so there's always a fallback.
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Loyalty & Referrals" subtitle="Earn points on every delivery, and more when you invite friends." />

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Points balance" value={account?.points ?? 0} tone="accent" />
        <Stat label="Your referral code" value={account?.referralCode ?? "…"} />
      </div>

      <Card title="Invite a friend" bodyClassName="p-4">
        <p className="text-[13.5px] leading-relaxed text-fg-muted">
          Share your code — when a friend signs up with it, they get <strong>50 bonus points</strong> and
          you get <strong>100 points</strong>. Earn 1 point per dollar on every delivery, automatically,
          the moment it's marked delivered.
        </p>
        {account && (
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <code className="flex-1 rounded-lg border border-line bg-bg px-3 py-2 text-[13px] text-fg">
              {referralLink}
            </code>
            <button
              onClick={copyLink}
              className="rounded-lg bg-inverse px-4 py-2 text-[13px] font-medium text-inverse-fg transition hover:opacity-90"
            >
              {copied ? "Copied!" : "Copy link"}
            </button>
          </div>
        )}
      </Card>

      <Card title="Activity" bodyClassName="">
        {transactions === null ? (
          <p className="p-4 text-sm text-fg-muted">Loading…</p>
        ) : transactions.length ? (
          <ul className="divide-y divide-line">
            {transactions.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="text-[13.5px] font-medium text-fg">{REASON_LABEL[t.reason] ?? t.reason}</p>
                  <p className="mt-0.5 text-[12px] text-fg-subtle">{new Date(t.createdAt).toLocaleString()}</p>
                </div>
                <span className={`font-semibold tabular-nums ${t.points >= 0 ? "text-ok" : "text-danger"}`}>
                  {t.points >= 0 ? "+" : ""}
                  {t.points}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No activity yet" hint="Points show up here as soon as you earn or redeem them." />
        )}
      </Card>
    </div>
  );
}
