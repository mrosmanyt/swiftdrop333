"use client";

import { useEffect, useRef, useState } from "react";

interface Message {
  id: string;
  senderRole: "customer" | "courier" | "merchant" | "admin";
  body: string;
  createdAt: string;
}

const ROLE_LABEL: Record<string, string> = {
  customer: "Customer",
  courier: "Courier",
  merchant: "Store",
  admin: "Support",
};

/**
 * Per-delivery chat. Nobody's phone number is exposed — the courier and
 * the customer talk here instead ("which buzzer?", "leave it with the
 * concierge"). Polls every 5s so it feels live without a socket server.
 */
export default function OrderChat({ orderId, compact = false }: { orderId: string; compact?: boolean }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [you, setYou] = useState<string>("customer");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      const res = await fetch(`/api/orders/${orderId}/messages`, { cache: "no-store" });
      if (!res.ok || cancelled) return;
      const data = await res.json();
      setMessages(data.messages ?? []);
      setYou(data.you ?? "customer");
    }
    poll();
    const t = setInterval(poll, 5000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [orderId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setBusy(true);
    const res = await fetch(`/api/orders/${orderId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    setBusy(false);
    if (res.ok) {
      setDraft("");
      // optimistic append until the next poll
      setMessages((m) => [
        ...m,
        { id: Math.random().toString(), senderRole: you as any, body, createdAt: new Date().toISOString() },
      ]);
    }
  }

  return (
    <div className="rounded-xl border border-line bg-surface">
      <div className="border-b border-line px-4 py-2">
        <p className="text-sm font-medium">Messages</p>
        <p className="text-xs text-fg-subtle">Phone numbers stay private — chat here instead.</p>
      </div>

      <div className={`space-y-2 overflow-y-auto p-4 ${compact ? "max-h-48" : "max-h-72"}`}>
        {messages.map((m) => {
          const mine = m.senderRole === you;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  mine ? "bg-accent-solid text-white" : "bg-surface-2 text-fg"
                }`}
              >
                {!mine && (
                  <p className="text-[11px] font-medium opacity-70">{ROLE_LABEL[m.senderRole]}</p>
                )}
                <p className="whitespace-pre-wrap">{m.body}</p>
                <p className={`mt-0.5 text-[10px] ${mine ? "text-white/70" : "text-fg-subtle"}`}>
                  {new Date(m.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        {!messages.length && (
          <p className="text-sm text-fg-subtle">No messages yet.</p>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={sendMessage} className="flex gap-2 border-t border-line p-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 rounded-lg border border-line px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={busy || !draft.trim()}
          className="rounded-lg bg-accent-solid px-3 py-2 text-sm text-white hover:opacity-90 disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </div>
  );
}
