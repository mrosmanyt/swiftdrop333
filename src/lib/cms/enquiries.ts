import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { ENQUIRY_STATUSES, isEnquiryStatus, type Enquiry, type EnquiryNote, type EnquiryStatus } from "./enquiryStatus";

const now = () => new Date().toISOString();

function mapEnquiry(r: any): Enquiry {
  let notes: EnquiryNote[] = [];
  try {
    const v = JSON.parse(r.notes ?? "[]");
    if (Array.isArray(v)) notes = v;
  } catch {}
  return {
    id: r.id,
    type: r.type,
    name: r.name,
    email: r.email ?? null,
    phone: r.phone ?? null,
    company: r.company ?? null,
    city: r.city ?? null,
    message: r.message ?? null,
    status: isEnquiryStatus(r.status) ? r.status : "new",
    notes,
    followUpOn: r.follow_up_on ?? null,
    assignedTo: r.assigned_to ?? null,
    assignedEmail: r.assigned_email ?? null,
    sourcePath: r.source_path ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function createEnquiry(input: {
  type: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  city?: string | null;
  message?: string | null;
  sourcePath?: string | null;
  ipHash?: string | null;
}) {
  const id = randomUUID();
  const ts = now();
  await db
    .prepare(
      `INSERT INTO enquiries (id, type, name, email, phone, company, city, message, source_path, ip_hash, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(id, input.type, input.name, input.email, input.phone, input.company, input.city, input.message, input.sourcePath, input.ipHash, ts, ts);
  return id;
}

/** How many enquiries this (hashed) address sent since `sinceIso` — the durable half of the spam limit. */
export async function countEnquiriesFrom(ipHash: string, sinceIso: string): Promise<number> {
  const r = await db.prepare(`SELECT COUNT(*) AS n FROM enquiries WHERE ip_hash = ? AND created_at >= ?`).get(ipHash, sinceIso);
  return Number(r?.n ?? 0);
}

export interface EnquiryFilters {
  status?: string;
  type?: string;
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
  q?: string;
}

export async function listEnquiries(f: EnquiryFilters = {}, limit = 500): Promise<Enquiry[]> {
  const where: string[] = [];
  const params: unknown[] = [];
  if (f.status && isEnquiryStatus(f.status)) (where.push(`e.status = ?`), params.push(f.status));
  if (f.type) (where.push(`e.type = ?`), params.push(f.type));
  if (f.from && /^\d{4}-\d{2}-\d{2}$/.test(f.from)) (where.push(`e.created_at >= ?`), params.push(`${f.from}T00:00:00.000Z`));
  if (f.to && /^\d{4}-\d{2}-\d{2}$/.test(f.to)) (where.push(`e.created_at <= ?`), params.push(`${f.to}T23:59:59.999Z`));
  if (f.q) {
    const like = `%${f.q.toLowerCase().replace(/[%_\\]/g, "\\$&")}%`;
    where.push(
      `(LOWER(e.name) LIKE ? OR LOWER(COALESCE(e.email,'')) LIKE ? OR LOWER(COALESCE(e.phone,'')) LIKE ? OR LOWER(COALESCE(e.company,'')) LIKE ? OR LOWER(COALESCE(e.message,'')) LIKE ?)`
    );
    params.push(like, like, like, like, like);
  }
  const rows = await db
    .prepare(
      `SELECT e.*, u.email AS assigned_email FROM enquiries e
       LEFT JOIN users u ON u.id = e.assigned_to
       ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
       ORDER BY e.created_at DESC LIMIT ${Math.min(5000, Math.max(1, Math.floor(limit)))}`
    )
    .all(...params);
  return rows.map(mapEnquiry);
}

export async function getEnquiry(id: string): Promise<Enquiry | null> {
  const r = await db
    .prepare(`SELECT e.*, u.email AS assigned_email FROM enquiries e LEFT JOIN users u ON u.id = e.assigned_to WHERE e.id = ?`)
    .get(id);
  return r ? mapEnquiry(r) : null;
}

export async function updateEnquiry(
  id: string,
  patch: { status?: EnquiryStatus; followUpOn?: string | null; assignedTo?: string | null; note?: string },
  actorEmail: string
) {
  const current = await getEnquiry(id);
  if (!current) return null;
  const notes = current.notes.slice(-199);
  if (patch.note) notes.push({ at: now(), by: actorEmail, text: patch.note.slice(0, 2000) });
  await db
    .prepare(`UPDATE enquiries SET status = ?, follow_up_on = ?, assigned_to = ?, notes = ?, updated_at = ? WHERE id = ?`)
    .run(
      patch.status ?? current.status,
      patch.followUpOn === undefined ? current.followUpOn : patch.followUpOn,
      patch.assignedTo === undefined ? current.assignedTo : patch.assignedTo,
      JSON.stringify(notes),
      now(),
      id
    );
  return getEnquiry(id);
}

export async function deleteEnquiry(id: string) {
  return (await db.prepare(`DELETE FROM enquiries WHERE id = ?`).run(id)).changes > 0;
}

/** Numbers for the dashboard: pipeline counts, follow-ups due, enquiries per day. */
export async function enquirySummary(days = 30) {
  const today = new Date().toISOString().slice(0, 10);
  const since = new Date(Date.now() - (days - 1) * 86400_000).toISOString().slice(0, 10);
  const [byStatus, due, perDay] = await Promise.all([
    db.prepare(`SELECT status, COUNT(*) AS n FROM enquiries GROUP BY status`).all(),
    db
      .prepare(
        `SELECT
           SUM(CASE WHEN follow_up_on = ? THEN 1 ELSE 0 END) AS today,
           SUM(CASE WHEN follow_up_on < ? THEN 1 ELSE 0 END) AS overdue
         FROM enquiries WHERE follow_up_on IS NOT NULL AND status NOT IN ('won','lost')`
      )
      .get(today, today),
    db
      .prepare(`SELECT SUBSTR(created_at, 1, 10) AS day, COUNT(*) AS n FROM enquiries WHERE created_at >= ? GROUP BY 1 ORDER BY 1`)
      .all(`${since}T00:00:00.000Z`),
  ]);
  const counts: Record<string, number> = {};
  for (const s of ENQUIRY_STATUSES) counts[s.value] = 0;
  for (const r of byStatus) counts[r.status] = Number(r.n);
  const perDayMap = new Map<string, number>(perDay.map((r: any) => [r.day, Number(r.n)]));
  const series: { day: string; n: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400_000).toISOString().slice(0, 10);
    series.push({ day: d, n: perDayMap.get(d) ?? 0 });
  }
  return { counts, dueToday: Number(due?.today ?? 0), overdue: Number(due?.overdue ?? 0), series };
}

export async function allEnquiriesForBackup() {
  return (await db.prepare(`SELECT * FROM enquiries ORDER BY created_at`).all()).map((r: any) => {
    const { ip_hash, ...rest } = r;
    return rest;
  });
}
