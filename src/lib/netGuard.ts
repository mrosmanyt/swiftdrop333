import { lookup } from "node:dns/promises";
import net from "node:net";

/**
 * Outbound-request guard for merchant-supplied webhook URLs (SSRF).
 *
 * Without it a merchant could point their webhook at the server's own
 * network — localhost, Railway's private *.railway.internal services, the
 * cloud metadata address 169.254.169.254 — and read the response codes on
 * their Tools page to map the internal network.
 */

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) || // CGNAT
      (a === 169 && b === 254) || // link-local / cloud metadata
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    );
  }
  if (net.isIPv6(ip)) {
    const v = ip.toLowerCase();
    if (v === "::" || v === "::1") return true;
    if (v.startsWith("fc") || v.startsWith("fd")) return true; // ULA
    if (v.startsWith("fe8") || v.startsWith("fe9") || v.startsWith("fea") || v.startsWith("feb")) return true; // link-local
    // IPv4-mapped / IPv4-compatible / NAT64 forms (::ffff:7f00:1 is
    // 127.0.0.1 in disguise) — a webhook has no legitimate reason to use
    // them, so block the whole ranges rather than try to decode them.
    if (v.startsWith("::ffff:") || v.startsWith("64:ff9b:") || /^::[0-9a-f]/.test(v) || v.startsWith("0:0:0:0:0:ffff:")) return true;
    return false;
  }
  return true;
}

const BLOCKED_HOST_SUFFIXES = [".internal", ".local", ".localhost", ".lan", ".home", ".corp"];

/** Cheap synchronous check used when the URL is saved. */
export function webhookUrlProblem(raw: string): string | null {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return "Not a valid URL.";
  }
  if (u.protocol !== "https:") return "Webhook URLs must use https://";
  if (u.username || u.password) return "Webhook URLs can't contain credentials.";
  const host = u.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || BLOCKED_HOST_SUFFIXES.some((s) => host.endsWith(s))) {
    return "Webhook URLs must point to a public internet address.";
  }
  if (net.isIP(host) && isPrivateIp(host)) return "Webhook URLs must point to a public internet address.";
  if (u.port && !["443", "8443"].includes(u.port)) return "Webhook URLs must use port 443 (or 8443).";
  return null;
}

/** Full check right before sending: resolves DNS and rejects private targets. */
export async function assertPublicWebhookUrl(raw: string): Promise<void> {
  const problem = webhookUrlProblem(raw);
  if (problem) throw new Error(problem);
  const host = new URL(raw).hostname.replace(/^\[|\]$/g, "");
  const addrs = net.isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
  if (!addrs.length || addrs.some((a) => isPrivateIp(a.address))) {
    throw new Error("Webhook host resolves to a private address.");
  }
}
