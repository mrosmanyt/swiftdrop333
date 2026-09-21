import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { pushToOrder, pushToUser } from "@/lib/push";

/**
 * Notifications — SMS and email.
 *
 * Works with or without provider credentials:
 *  - With TWILIO_* / RESEND_API_KEY set, messages are actually sent.
 *  - Without them, every message is still rendered and written to the
 *    `notifications` table with status 'logged', and shown in the admin
 *    Notifications page. So the whole flow is testable today, and turning
 *    it on in production is just adding keys to .env — no code change.
 *
 * Every send is recorded either way, which doubles as the delivery audit
 * trail ("did the customer actually get their tracking link?").
 */

export type Channel = "sms" | "email";

interface SendInput {
  channel: Channel;
  to: string;
  template: string;
  subject?: string;
  body: string;
  orderId?: string;
}

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "SwiftDrop";
const APP_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

function record(input: SendInput & { status: string; provider: string; error?: string }) {
  db.prepare(
    `INSERT INTO notifications (id, order_id, channel, recipient, template, subject, body, status, provider, error, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    randomUUID(),
    input.orderId ?? null,
    input.channel,
    input.to,
    input.template,
    input.subject ?? null,
    input.body,
    input.status,
    input.provider,
    input.error ?? null,
    new Date().toISOString()
  );
}

async function sendSms(input: SendInput) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  if (!sid || !token || !from) {
    record({ ...input, status: "logged", provider: "console" });
    return { sent: false, logged: true };
  }

  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: input.to, From: from, Body: input.body }),
    });
    if (!res.ok) throw new Error(`twilio ${res.status}: ${await res.text()}`);
    record({ ...input, status: "sent", provider: "twilio" });
    return { sent: true, logged: true };
  } catch (e: any) {
    record({ ...input, status: "failed", provider: "twilio", error: String(e?.message ?? e) });
    return { sent: false, logged: true };
  }
}

async function sendEmail(input: SendInput) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!key || !from) {
    record({ ...input, status: "logged", provider: "console" });
    return { sent: false, logged: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: input.to,
        subject: input.subject ?? APP_NAME,
        text: input.body,
      }),
    });
    if (!res.ok) throw new Error(`resend ${res.status}: ${await res.text()}`);
    record({ ...input, status: "sent", provider: "resend" });
    return { sent: true, logged: true };
  } catch (e: any) {
    record({ ...input, status: "failed", provider: "resend", error: String(e?.message ?? e) });
    return { sent: false, logged: true };
  }
}

export async function send(input: SendInput) {
  if (!input.to) return { sent: false, logged: false };
  return input.channel === "sms" ? sendSms(input) : sendEmail(input);
}

// ---------------------------------------------------------------------------
// Order lifecycle notifications
// ---------------------------------------------------------------------------

function trackingUrl(orderId: string) {
  return `${APP_URL}/track/${orderId}`;
}

interface OrderLike {
  id: string;
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  merchantBusinessName?: string | null;
  dropoffAddress: string;
  windowEnd?: string | null;
}

/** Sent the moment a delivery is booked — this is the tracking link. */
export async function notifyOrderCreated(order: OrderLike) {
  const url = trackingUrl(order.id);
  const by = order.windowEnd
    ? ` by ${new Date(order.windowEnd).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
    : "";
  const body = `${order.merchantBusinessName ?? APP_NAME}: your delivery is on its way${by}. Track it live: ${url}`;

  await Promise.all([
    send({
      channel: "sms",
      to: order.customerPhone ?? "",
      template: "order_created",
      body,
      orderId: order.id,
    }),
    send({
      channel: "email",
      to: order.customerEmail ?? "",
      template: "order_created",
      subject: `Your delivery from ${order.merchantBusinessName ?? APP_NAME}`,
      body: `Hi ${order.customerName},\n\n${body}\n\nDelivering to: ${order.dropoffAddress}`,
      orderId: order.id,
    }),
  ]);
}

/** Courier accepted — customer now has someone on the way. */
export async function notifyCourierAssigned(order: OrderLike) {
  const body = `Your ${order.merchantBusinessName ?? APP_NAME} delivery has a courier on the way. Follow them live: ${trackingUrl(order.id)}`;
  await Promise.all([
    send({ channel: "sms", to: order.customerPhone ?? "", template: "courier_assigned", body, orderId: order.id }),
    send({
      channel: "email",
      to: order.customerEmail ?? "",
      template: "courier_assigned",
      subject: "A courier is on the way",
      body,
      orderId: order.id,
    }),
    pushToOrder(order.id, {
      title: "Courier on the way",
      body: `Your ${order.merchantBusinessName ?? APP_NAME} order has a courier heading to you.`,
      url: trackingUrl(order.id),
      tag: "order-status",
    }),
  ]);
}

export async function notifyPickedUp(order: OrderLike) {
  const body = `Your order has been picked up and is on its way to ${order.dropoffAddress}. Live tracking: ${trackingUrl(order.id)}`;
  await Promise.all([
    send({ channel: "sms", to: order.customerPhone ?? "", template: "picked_up", body, orderId: order.id }),
    pushToOrder(order.id, {
      title: "Picked up",
      body: `Your order is on its way to ${order.dropoffAddress}.`,
      url: trackingUrl(order.id),
      tag: "order-status",
    }),
  ]);
}

/** merchantUserId, when known, also pushes the merchant — their email
 * already gets notified below, this just makes it show up instantly too. */
export async function notifyDelivered(order: OrderLike, merchantEmail?: string | null, merchantUserId?: string | null) {
  const customerBody = `Your delivery has arrived. Photo proof and a quick rating: ${trackingUrl(order.id)}`;
  await Promise.all([
    send({ channel: "sms", to: order.customerPhone ?? "", template: "delivered", body: customerBody, orderId: order.id }),
    send({
      channel: "email",
      to: merchantEmail ?? "",
      template: "delivered_merchant",
      subject: `Delivered — ${order.customerName}`,
      body: `Your delivery to ${order.customerName} (${order.dropoffAddress}) was completed. Details: ${trackingUrl(order.id)}`,
      orderId: order.id,
    }),
    pushToOrder(order.id, {
      title: "Delivered",
      body: "Your order has arrived. Tap to leave a rating.",
      url: trackingUrl(order.id),
      tag: "order-status",
    }),
    merchantUserId
      ? pushToUser(merchantUserId, {
          title: `Delivered — ${order.customerName}`,
          body: `${order.dropoffAddress}`,
          url: `/merchant/orders/${order.id}`,
          tag: "order-delivered",
        })
      : Promise.resolve(),
  ]);
}

/** Failed delivery — the merchant needs to know their parcel is coming back. */
export async function notifyReturning(order: OrderLike, merchantEmail: string | null, reason: string) {
  await send({
    channel: "email",
    to: merchantEmail ?? "",
    template: "returning",
    subject: `Delivery failed — parcel returning (${order.customerName})`,
    body: `The delivery to ${order.customerName} at ${order.dropoffAddress} couldn't be completed.\n\nReason: ${reason}\n\nThe courier is bringing the parcel back to you. Details: ${trackingUrl(order.id)}`,
    orderId: order.id,
  });
}

/** Order cancelled before pickup — customer + merchant both need to know. */
export async function notifyCancelled(order: OrderLike, merchantEmail?: string | null, reason?: string) {
  const custBody = `Your ${order.merchantBusinessName ?? APP_NAME} delivery to ${order.dropoffAddress} has been cancelled.${
    reason ? ` Reason: ${reason}` : ""
  }`;
  await Promise.all([
    send({ channel: "sms", to: order.customerPhone ?? "", template: "cancelled", body: custBody, orderId: order.id }),
    send({
      channel: "email",
      to: merchantEmail ?? "",
      template: "cancelled_merchant",
      subject: `Order cancelled — ${order.customerName}`,
      body: `The delivery to ${order.customerName} (${order.dropoffAddress}) was cancelled.${
        reason ? `\n\nReason: ${reason}` : ""
      }`,
      orderId: order.id,
    }),
    pushToOrder(order.id, {
      title: "Order cancelled",
      body: custBody,
      url: trackingUrl(order.id),
      tag: "order-status",
    }),
  ]);
}

/** New chat message waiting for the customer. */
export async function notifyNewMessage(order: OrderLike, from: string, preview: string) {
  await send({
    channel: "sms",
    to: order.customerPhone ?? "",
    template: "new_message",
    body: `Message from your ${from}: "${preview}" — reply here: ${trackingUrl(order.id)}`,
    orderId: order.id,
  });
}
