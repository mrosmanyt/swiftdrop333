/**
 * "Is typing…" state for order chat threads. Deliberately not in the
 * database — this is seconds-lived and read far more often than it's
 * written, so a module-level map (Next.js keeps one Node process alive
 * per server instance) is the right amount of infrastructure for it. If
 * this ever runs across multiple server instances, this map would need to
 * move to something shared (Redis, etc.) — noted here so that's not a
 * surprise later.
 */

const TYPING_TTL_MS = 4000;

const typingByOrder = new Map<string, Map<string, number>>();

/** Call whenever a role's input changes — marks them as typing for the next few seconds. */
export function signalTyping(orderId: string, role: string) {
  let byRole = typingByOrder.get(orderId);
  if (!byRole) {
    byRole = new Map();
    typingByOrder.set(orderId, byRole);
  }
  byRole.set(role, Date.now());
}

/** Every role currently typing in this thread, excluding `exclude` (the requester shouldn't see their own indicator). */
export function whoIsTyping(orderId: string, exclude?: string): string[] {
  const byRole = typingByOrder.get(orderId);
  if (!byRole) return [];
  const cutoff = Date.now() - TYPING_TTL_MS;
  const active: string[] = [];
  for (const [role, at] of byRole.entries()) {
    if (at < cutoff) {
      byRole.delete(role);
      continue;
    }
    if (role !== exclude) active.push(role);
  }
  return active;
}
