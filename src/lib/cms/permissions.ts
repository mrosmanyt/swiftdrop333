/**
 * Staff roles for the admin console.
 *
 * Every signed-in admin (users.role = 'ADMIN') has exactly one staff role.
 * Owner and Administrator can use the whole console. The other three are
 * limited to the Website area and can never open orders, finance, couriers,
 * merchants or any other operations screen — that is enforced on the server
 * (src/lib/session.ts and src/middleware.ts), not just hidden in the menu.
 *
 * This file has no server-only imports so the middleware and client
 * components can use it too.
 */

export type StaffRole = "owner" | "administrator" | "editor" | "sales" | "viewer";

export const STAFF_ROLES: { value: StaffRole; label: string; about: string }[] = [
  { value: "owner", label: "Owner", about: "Everything, including adding and removing other owners." },
  { value: "administrator", label: "Administrator", about: "Everything except changing owners." },
  { value: "editor", label: "Content Editor", about: "Edits and publishes website content. Cannot see enquiries or operations." },
  { value: "sales", label: "Sales & Enquiries", about: "Works the enquiries inbox. Cannot edit the website or see operations." },
  { value: "viewer", label: "Viewer", about: "Can look at website stats, content and enquiries but cannot change anything." },
];

export type Permission =
  | "ops" // the existing operations console (orders, finance, couriers, ...)
  | "analytics.view"
  | "content.view"
  | "content.edit"
  | "content.publish"
  | "enquiries.view"
  | "enquiries.edit"
  | "enquiries.export"
  | "enquiries.delete"
  | "settings.edit" // email alerts
  | "activity.view"
  | "backup.manage"
  | "staff.manage";

const ALL: Permission[] = [
  "ops",
  "analytics.view",
  "content.view",
  "content.edit",
  "content.publish",
  "enquiries.view",
  "enquiries.edit",
  "enquiries.export",
  "enquiries.delete",
  "settings.edit",
  "activity.view",
  "backup.manage",
  "staff.manage",
];

const MATRIX: Record<StaffRole, Permission[]> = {
  owner: ALL,
  administrator: ALL,
  editor: ["analytics.view", "content.view", "content.edit", "content.publish"],
  sales: ["analytics.view", "enquiries.view", "enquiries.edit", "enquiries.export"],
  viewer: ["analytics.view", "content.view", "enquiries.view"],
};

/** NULL / unknown in the database means owner: admins that existed before roles did. */
export function normalizeStaffRole(value: unknown): StaffRole {
  return value === "administrator" || value === "editor" || value === "sales" || value === "viewer" ? value : "owner";
}

export function can(role: StaffRole, permission: Permission): boolean {
  return MATRIX[role].includes(permission);
}

/** Limited roles only ever see the Website area. */
export function isLimitedStaff(role: unknown): boolean {
  return !can(normalizeStaffRole(role), "ops");
}

export function staffRoleLabel(role: StaffRole): string {
  return STAFF_ROLES.find((r) => r.value === role)?.label ?? role;
}

/** Header every write request from the admin screens must carry (CSRF). */
export const CSRF_HEADER = "x-swiftdrop-admin";
