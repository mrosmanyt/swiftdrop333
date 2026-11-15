import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { writeAudit } from "@/lib/repo";
import { passwordProblem } from "@/lib/password";
import { adminJson, requireStaff } from "@/lib/cms/staff";
import { createStaff, listStaff } from "@/lib/cms/staffRepo";

export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  fullName: z.string().trim().min(1).max(120),
  password: z.string().min(8).max(200),
  staffRole: z.enum(["owner", "administrator", "editor", "sales", "viewer"]),
});

export async function GET() {
  const staff = await requireStaff("staff.manage");
  if (staff instanceof NextResponse) return staff;
  return adminJson({ staff: await listStaff(), me: staff.id });
}

// POST — add a staff member. They sign in with the password you set, then change it.
export async function POST(req: NextRequest) {
  const staff = await requireStaff("staff.manage", req);
  if (staff instanceof NextResponse) return staff;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return adminJson({ error: "Please fill in a name, a valid email and a password." }, { status: 400 });
  if (parsed.data.staffRole === "owner" && staff.staffRole !== "owner") {
    return adminJson({ error: "Only an owner can add another owner." }, { status: 403 });
  }
  const problem = passwordProblem(parsed.data.password);
  if (problem) return adminJson({ error: `The password needs ${problem}.` }, { status: 400 });

  const result = await createStaff(parsed.data);
  if ("error" in result) return adminJson({ error: result.error }, { status: 409 });
  await writeAudit(staff.id, "staff_added", "user", result.id, `${parsed.data.email} as ${parsed.data.staffRole}`);
  return adminJson({ staff: await listStaff(), me: staff.id });
}
