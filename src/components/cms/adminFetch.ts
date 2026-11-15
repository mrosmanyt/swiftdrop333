import { CSRF_HEADER } from "@/lib/cms/permissions";

/**
 * fetch() for the admin Website screens. Adds the CSRF header every write
 * needs and turns any failure into a plain-English message.
 */
export async function adminFetch<T = any>(
  url: string,
  options: { method?: string; json?: unknown; body?: BodyInit } = {}
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const headers: Record<string, string> = { [CSRF_HEADER]: "1" };
    if (options.json !== undefined) headers["Content-Type"] = "application/json";
    const res = await fetch(url, {
      method: options.method ?? "GET",
      headers,
      body: options.json !== undefined ? JSON.stringify(options.json) : options.body,
      credentials: "same-origin",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const fallback =
        res.status === 401
          ? "You have been signed out. Please sign in again."
          : res.status === 403
          ? "Your role is not allowed to do this."
          : "Something went wrong. Please try again.";
      return { ok: false, error: typeof data?.error === "string" ? data.error : fallback };
    }
    return { ok: true, data };
  } catch {
    return { ok: false, error: "No connection. Check your internet and try again." };
  }
}
