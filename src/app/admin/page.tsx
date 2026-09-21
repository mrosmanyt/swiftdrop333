import { redirect } from "next/navigation";

/**
 * /admin has no screen of its own — the console starts at the dashboard.
 * Without this, an admin typing the bare URL lands on a 404, which reads
 * like the console is gone rather than one path segment short.
 */
export default function AdminIndexPage() {
  redirect("/admin/dashboard");
}
