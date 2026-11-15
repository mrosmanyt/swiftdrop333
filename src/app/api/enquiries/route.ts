import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { clientIp, hit } from "@/lib/rateLimit";
import { send } from "@/lib/notify";
import { getContent } from "@/lib/cms/content";
import { dailyIpHash } from "@/lib/cms/analytics";
import { countEnquiriesFrom, createEnquiry } from "@/lib/cms/enquiries";

export const dynamic = "force-dynamic";

const schema = z
  .object({
    type: z.string().trim().min(1).max(60),
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().toLowerCase().email().max(200).optional().or(z.literal("")),
    phone: z.string().trim().max(40).regex(/^[0-9+()\-.\s]*$/).optional().or(z.literal("")),
    company: z.string().trim().max(160).optional(),
    city: z.string().trim().max(80).optional(),
    message: z.string().trim().min(5).max(3000),
    sourcePath: z.string().max(200).optional(),
    // Honeypot: a field people never see. Only bots fill it in.
    website: z.string().max(200).optional(),
  })
  .refine((v) => !!v.email || !!v.phone, { message: "contact" });

// POST /api/enquiries — the public contact form.
export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  if (!hit(`enquiry:${ip}`, 5, 10 * 60 * 1000).ok) {
    return NextResponse.json({ error: "Too many messages. Please try again in a few minutes." }, { status: 429 });
  }

  const raw = await req.text();
  if (raw.length > 10_000) return NextResponse.json({ error: "That message is too long." }, { status: 413 });
  let json: unknown = null;
  try {
    json = JSON.parse(raw);
  } catch {}
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    const contact = parsed.error.issues.some((i) => i.message === "contact");
    return NextResponse.json(
      { error: contact ? "Please give us an email address or a phone number so we can reply." : "Please check the form and try again." },
      { status: 400 }
    );
  }
  const d = parsed.data;

  // A filled honeypot gets a normal-looking "thanks" and is thrown away.
  if (d.website) return NextResponse.json({ ok: true });

  // The in-memory limit above resets when a server instance restarts; this
  // one is kept in the database (as a daily hash, never the address itself).
  const ipHash = dailyIpHash(ip);
  const dayAgo = new Date(Date.now() - 86400_000).toISOString();
  if ((await countEnquiriesFrom(ipHash, dayAgo)) >= 10) {
    return NextResponse.json({ error: "Too many messages today. Please try again tomorrow." }, { status: 429 });
  }

  // Only types the site actually offers are accepted.
  const contact = await getContent("contact");
  const type = contact.types.includes(d.type) ? d.type : "Something else";

  const id = await createEnquiry({
    type,
    name: d.name,
    email: d.email || null,
    phone: d.phone || null,
    company: d.company || null,
    city: d.city || null,
    message: d.message,
    sourcePath: d.sourcePath?.startsWith("/") ? d.sourcePath : null,
    ipHash,
  });

  // Email alert (Website → Email alerts). A failed email never fails the form.
  try {
    const alerts = await getContent("alerts");
    if (alerts.enabled && alerts.recipients.length) {
      const base = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "";
      const body = [
        `New ${type} enquiry from the website.`,
        "",
        `Name: ${d.name}`,
        d.company ? `Business: ${d.company}` : null,
        d.email ? `Email: ${d.email}` : null,
        d.phone ? `Phone: ${d.phone}` : null,
        d.city ? `City: ${d.city}` : null,
        "",
        d.message,
        "",
        `Open it: ${base}/admin/website/enquiries`,
      ]
        .filter((l) => l !== null)
        .join("\n");
      await Promise.all(
        alerts.recipients.slice(0, 10).map((to) =>
          send({ channel: "email", to, template: "enquiry_alert", subject: `New enquiry: ${d.name}`, body })
        )
      );
    }
  } catch (e) {
    console.error("[enquiries] alert email failed", e);
  }

  return NextResponse.json({ ok: true, id });
}
