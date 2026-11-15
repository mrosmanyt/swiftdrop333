import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createAdminProfile, createUser, findUserByEmail, findUserById } from "@/lib/repo";
import { normalizeStaffRole, type StaffRole } from "./permissions";

/** Staff = every user with role ADMIN. Their staff role decides what they can do. */

export interface StaffMember {
  id: string;
  email: string;
  fullName: string | null;
  staffRole: StaffRole;
  status: string;
  createdAt: string;
}

export async function listStaff(): Promise<StaffMember[]> {
  const rows = await db
    .prepare(`SELECT id, email, full_name, staff_role, status, created_at FROM users WHERE role = 'ADMIN' ORDER BY created_at`)
    .all();
  return rows.map((r: any) => ({
    id: r.id,
    email: r.email,
    fullName: r.full_name ?? null,
    staffRole: normalizeStaffRole(r.staff_role),
    status: r.status ?? "active",
    createdAt: r.created_at,
  }));
}

export async function getStaffMember(id: string): Promise<StaffMember | null> {
  const u = await findUserById(id);
  if (!u || u.role !== "ADMIN") return null;
  return { id: u.id, email: u.email, fullName: u.fullName, staffRole: normalizeStaffRole(u.staffRole), status: u.status, createdAt: u.createdAt };
}

export async function activeOwnerCount(): Promise<number> {
  const r = await db
    .prepare(`SELECT COUNT(*) AS n FROM users WHERE role = 'ADMIN' AND status = 'active' AND (staff_role IS NULL OR staff_role = 'owner')`)
    .get();
  return Number(r?.n ?? 0);
}

export async function createStaff(input: { email: string; fullName: string; password: string; staffRole: StaffRole }) {
  if (await findUserByEmail(input.email)) return { error: "Someone already has an account with that email address." } as const;
  const id = await db.tx(async () => {
    const userId = await createUser({
      email: input.email,
      fullName: input.fullName,
      passwordHash: await bcrypt.hash(input.password, 12),
      role: "ADMIN",
    });
    await createAdminProfile({ userId });
    await db.prepare(`UPDATE users SET staff_role = ? WHERE id = ?`).run(input.staffRole, userId);
    return userId;
  });
  return { id } as const;
}

/** Signs the person out of every device: sessions created before now stop working. */
export async function invalidateSessions(userId: string) {
  const ts = new Date().toISOString();
  await db.prepare(`UPDATE users SET sessions_valid_after = ?, updated_at = ? WHERE id = ?`).run(ts, ts, userId);
}

export async function setStaffRole(userId: string, staffRole: StaffRole) {
  await db.prepare(`UPDATE users SET staff_role = ?, updated_at = ? WHERE id = ?`).run(staffRole, new Date().toISOString(), userId);
  // Their session still carries the old role — make them sign in again.
  await invalidateSessions(userId);
}

export async function setStaffPassword(userId: string, password: string) {
  const ts = new Date().toISOString();
  await db
    .prepare(`UPDATE users SET password_hash = ?, password_changed_at = ?, updated_at = ? WHERE id = ?`)
    .run(await bcrypt.hash(password, 12), ts, ts, userId);
}
