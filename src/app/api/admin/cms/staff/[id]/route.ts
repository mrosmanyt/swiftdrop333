import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { setUserStatus, writeAudit } from "@/lib/repo";
import { passwordProblem } from "@/lib/password";
import { adminJson, requireStaff } from "@/lib/cms/staff";
import { activeOwnerCount, getStaffMember, invalidateSessions, listStaff, setStaffPassword, setStaffRole } from "@/lib/cms/staffRepo";

export const dynamic = "force-dynamic";

const schema = z.object({
  staffRole: z.enum(["owner", "administrator", "editor", "sales", "viewer"]).optional(),
  status: z.enum(["active", "suspended"]).optional(),
  password: z.string().min(8).max(200).optional(),
  signOut: z.literal(true).optional(),
});

// PATCH — change a staff member's role, turn their access off/on, reset
// their password, or sign them out of every device.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireStaff("staff.manage", req);
  if (staff instanceof NextResponse) return staff;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return adminJson({ error: "Please check what you entered." }, { status: 400 });
  const target = await getStaffMember(params.id);
  if (!target) return adminJson({ error: "That staff member no longer exists." }, { status: 404 });

  const { staffRole, status, password, signOut } = parsed.data;
  const isSelf = target.id === staff.id;

  // Only owners may touch owners or create new ones.
  if (staff.staffRole !== "owner" && (target.staffRole === "owner" || staffRole === "owner")) {
    return adminJson({ error: "Only an owner can change an owner." }, { status: 403 });
  }
  if (isSelf && (staffRole || status)) {
    return adminJson({ error: "You can't change your own role or access. Ask another owner." }, { status: 400 });
  }
  // Never leave the business without an owner who can sign in.
  const removesOwner =
    target.staffRole === "owner" && target.status === "active" && ((staffRole && staffRole !== "owner") || status === "suspended");
  if (removesOwner && (await activeOwnerCount()) <= 1) {
    return adminJson({ error: "There must always be at least one active owner." }, { status: 400 });
  }
  if (password) {
    const problem = passwordProblem(password);
    if (problem) return adminJson({ error: `The password needs ${problem}.` }, { status: 400 });
  }

  if (staffRole && staffRole !== target.staffRole) {
    await setStaffRole(target.id, staffRole);
    await writeAudit(staff.id, "staff_role_changed", "user", target.id, `${target.email}: ${target.staffRole} → ${staffRole}`);
  }
  if (status && status !== target.status) {
    await setUserStatus(target.id, status);
    await writeAudit(staff.id, status === "suspended" ? "staff_access_removed" : "staff_access_restored", "user", target.id, target.email);
  }
  if (password) {
    // Changing the password also signs out every existing session.
    await setStaffPassword(target.id, password);
    await writeAudit(staff.id, "staff_password_reset", "user", target.id, target.email);
  }
  if (signOut) {
    await invalidateSessions(target.id);
    await writeAudit(staff.id, "staff_signed_out_everywhere", "user", target.id, target.email);
  }
  return adminJson({ staff: await listStaff(), me: staff.id });
}
