// Tiny CSV helper for admin report downloads. Deliberately dependency-free —
// this only ever runs against our own trusted server-side data (merchants,
// couriers, orders), so we don't need a full CSV parser, just a safe writer.

/** Escapes a single cell per RFC 4180: wraps in quotes if it contains a
 * comma, quote, or newline, and doubles any internal quotes. */
function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** Builds a CSV string (with header row) from an array of flat row objects. */
export function toCsv<T extends Record<string, unknown>>(rows: T[], columns: { key: keyof T; label: string }[]): string {
  const header = columns.map((c) => escapeCell(c.label)).join(",");
  const lines = rows.map((row) => columns.map((c) => escapeCell(row[c.key])).join(","));
  return [header, ...lines].join("\r\n") + "\r\n";
}

/** Wraps a CSV string in a downloadable Response with a timestamped filename. */
export function csvResponse(csv: string, baseName: string) {
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${baseName}-${stamp}.csv"`,
    },
  });
}
