import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { writeAudit } from "@/lib/repo";
import { adminJson, requireStaff } from "@/lib/cms/staff";
import { deleteEnquiry, updateEnquiry } from "@/lib/cms/enquiries";
import { ENQUIRY_STATUSES } from "@/lib/cms/enquiryStatus";
import { getStaffMember } from "@/lib/cms/staffRepo";

export const dynamic = "force-dynamic";

const schema = z.object({
  status: z.enum(ENQUIRY_STATUSES.map((s) => s.value) as [string, ...string[]]).optional(),
  followUpOn: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.null()]).optional(),
  assignedTo: z.union([z.string().uuid(), z.null()]).optional(),
  note: z.string().trim().min(1).max(2000).optional(),
});

// PATCH — change status, follow-up date, assigned staff, or add a note.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireStaff("enquiries.edit", req);
  if (staff instanceof NextResponse) return staff;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return adminJson({ error: "Please check what you entered." }, { status: 400 });
  if (parsed.data.assignedTo && !(await getStaffMember(parsed.data.assignedTo))) {
    return adminJson({ error: "That staff member no longer exists." }, { status: 400 });
  }
  const enquiry = await updateEnquiry(params.id, parsed.data as any, staff.email);
  if (!enquiry) return adminJson({ error: "This enquiry no longer exists." }, { status: 404 });
  const what = [
    parsed.data.status && `status → ${parsed.data.status}`,
    parsed.data.followUpOn !== undefined && `follow-up → ${parsed.data.followUpOn ?? "none"}`,
    parsed.data.assignedTo !== undefined && "assigned staff changed",
    parsed.data.note && "note added",
  ]
    .filter(Boolean)
    .join(", ");
  await writeAudit(staff.id, "enquiry_updated", "enquiry", params.id, what);
  return adminJson({ enquiry });
}

// DELETE — owners and administrators only.
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireStaff("enquiries.delete", req);
  if (staff instanceof NextResponse) return staff;
  if (!(await deleteEnquiry(params.id))) return adminJson({ error: "This enquiry no longer exists." }, { status: 404 });
  await writeAudit(staff.id, "enquiry_deleted", "enquiry", params.id);
  return adminJson({ ok: true });
}
