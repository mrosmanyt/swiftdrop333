import { NextRequest, NextResponse } from "next/server";
import { writeAudit } from "@/lib/repo";
import { csvResponse, toCsv } from "@/lib/csv";
import { requireStaff } from "@/lib/cms/staff";
import { listEnquiries } from "@/lib/cms/enquiries";
import { enquiryStatusLabel } from "@/lib/cms/enquiryStatus";

export const dynamic = "force-dynamic";

// GET /api/admin/cms/enquiries/export?status=&type=&from=&to= — opens in Excel.
// toCsv() neutralises cells that start with = + - @ (formula injection).
export async function GET(req: NextRequest) {
  const staff = await requireStaff("enquiries.export");
  if (staff instanceof NextResponse) return staff;
  const p = req.nextUrl.searchParams;
  const rows = (
    await listEnquiries(
      {
        status: p.get("status") ?? undefined,
        type: p.get("type") ?? undefined,
        from: p.get("from") ?? undefined,
        to: p.get("to") ?? undefined,
        q: (p.get("q") ?? "").slice(0, 100) || undefined,
      },
      5000
    )
  ).map((e) => ({
    received: e.createdAt.slice(0, 16).replace("T", " "),
    type: e.type,
    status: enquiryStatusLabel(e.status),
    name: e.name,
    company: e.company ?? "",
    email: e.email ?? "",
    phone: e.phone ?? "",
    city: e.city ?? "",
    message: e.message ?? "",
    followUp: e.followUpOn ?? "",
    assigned: e.assignedEmail ?? "",
    notes: e.notes.map((n) => `${n.at.slice(0, 10)} ${n.by}: ${n.text}`).join(" | "),
  }));
  await writeAudit(staff.id, "enquiries_exported", "enquiry", undefined, `${rows.length} rows`);
  const res = csvResponse(
    // The BOM makes Excel read accents and symbols correctly.
    "﻿" +
      toCsv(rows, [
        { key: "received", label: "Received (UTC)" },
        { key: "type", label: "Type" },
        { key: "status", label: "Status" },
        { key: "name", label: "Name" },
        { key: "company", label: "Business" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "city", label: "City" },
        { key: "message", label: "Message" },
        { key: "followUp", label: "Follow-up date" },
        { key: "assigned", label: "Assigned to" },
        { key: "notes", label: "Notes" },
      ]),
    "swiftdrop-enquiries"
  );
  res.headers.set("Cache-Control", "no-store");
  return res;
}
