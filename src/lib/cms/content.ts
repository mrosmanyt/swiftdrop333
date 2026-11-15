import { db } from "@/lib/db";
import { DEFAULTS, PRIVATE_SECTIONS, SECTION_KEYS, type CmsContent, type SectionKey } from "./defaults";
import { sectionDef, type Field } from "./sections";

/**
 * Reading and writing website content.
 *
 * Public pages call getContent("home") and get the PUBLISHED version merged
 * over the original built-in content (defaults.ts). If nothing was ever
 * published, or the database is unreachable, they get the originals — so the
 * website can never go blank because of the editor.
 */

const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";
const now = () => new Date().toISOString();

// ---------------------------------------------------------------------------
// Cleaning what the editor sends
// ---------------------------------------------------------------------------

/** Only ordinary links are allowed — never javascript:, data: and friends. */
export function safeHref(value: unknown): string {
  const v = String(value ?? "").trim().slice(0, 500);
  if (!v) return "";
  if (/^(\/(?!\/)|#)/.test(v)) return v; // same-site path or anchor
  if (/^https?:\/\//i.test(v)) return v;
  if (/^(mailto:|tel:)/i.test(v)) return v;
  return "";
}

export const MEDIA_URL_PATTERN = /^\/api\/cms\/media\/[0-9a-f-]{36}\.(jpeg|png|webp)$/;

const cleanText = (v: unknown, max: number) =>
  String(v ?? "")
    // strip control characters (keeps tabs/newlines out of single-line text too)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .slice(0, max);

function cleanField(field: Field, value: unknown, fallback: unknown): unknown {
  switch (field.type) {
    case "heading":
      return undefined;
    case "text":
      return cleanText(value, field.max ?? 200).replace(/[\r\n]+/g, " ");
    case "textarea":
      return cleanText(value, field.max ?? 1000);
    case "link":
      return safeHref(value);
    case "toggle":
      return value === true;
    case "image": {
      const v = String(value ?? "");
      return MEDIA_URL_PATTERN.test(v) ? v : "";
    }
    case "date": {
      const v = String(value ?? "");
      return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : "";
    }
    case "number": {
      const n = Number(value);
      return String(Number.isFinite(n) ? Math.min(600, Math.max(0, Math.round(n))) : 0);
    }
    case "lines": {
      const arr = Array.isArray(value) ? value : String(value ?? "").split("\n");
      return arr
        .map((x) => cleanText(x, field.max ?? 300).replace(/[\r\n]+/g, " ").trim())
        .filter(Boolean)
        .slice(0, 60);
    }
    case "select": {
      const v = String(value ?? "");
      if (field.options.some((o) => o.value === v)) return v;
      return typeof fallback === "string" ? fallback : field.options[0].value;
    }
    case "list": {
      const base = Array.isArray(fallback) ? (fallback as any[]) : [];
      const incoming = Array.isArray(value) ? value.slice(0, 60) : [];
      const cleanItem = (item: any, original: any) => {
        const out: Record<string, unknown> = {};
        for (const f of field.fields) {
          if (f.type === "heading") continue;
          out[f.name] = cleanField(f, item?.[f.name], original?.[f.name]);
        }
        if (!field.fixed && item?.hidden === true) out.hidden = true;
        return out;
      };
      // A fixed list always keeps its original length and order.
      if (field.fixed) return base.map((original, i) => cleanItem(incoming[i] ?? original, original));
      return incoming.map((item, i) => cleanItem(item, base[i]));
    }
  }
}

/** Keeps only the fields the section is allowed to have, each cleaned for its type. */
export function sanitizeSection(key: SectionKey, data: unknown): Record<string, unknown> {
  const def = sectionDef(key);
  if (!def) throw new Error(`Unknown section ${key}`);
  const input = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const defaults = DEFAULTS[key] as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const f of def.fields) {
    if (f.type === "heading") continue;
    out[f.name] = cleanField(f, f.name in input ? input[f.name] : defaults[f.name], defaults[f.name]);
  }
  return out;
}

const parse = (text: string | null | undefined): Record<string, unknown> | null => {
  if (!text) return null;
  try {
    const v = JSON.parse(text);
    return v && typeof v === "object" ? v : null;
  } catch {
    return null;
  }
};

// ---------------------------------------------------------------------------
// Public reads (cached for a few seconds per server instance)
// ---------------------------------------------------------------------------

const CACHE_MS = 20_000;
const g = globalThis as unknown as { __swiftdropCms?: { at: number; data: Record<string, Record<string, unknown>> } };

async function loadPublished(): Promise<Record<string, Record<string, unknown>>> {
  // `next build` must never depend on the database.
  if (isBuildPhase) return {};
  const hit = g.__swiftdropCms;
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.data;
  try {
    const rows = await db.prepare(`SELECT key, published FROM cms_content WHERE published IS NOT NULL`).all();
    const data: Record<string, Record<string, unknown>> = {};
    for (const r of rows) {
      const v = parse(r.published);
      if (v) data[r.key] = v;
    }
    g.__swiftdropCms = { at: Date.now(), data };
    return data;
  } catch (e) {
    console.error("[cms] could not load published content — showing the built-in content", e);
    return hit?.data ?? {};
  }
}

export function clearContentCache() {
  g.__swiftdropCms = undefined;
}

/** The content the public website should show for one section. */
export async function getContent<K extends SectionKey>(key: K): Promise<CmsContent[K]> {
  const published = (await loadPublished())[key];
  if (!published) return DEFAULTS[key];
  // Run it through the cleaner again on the way out: whatever is in the
  // database, the page only ever receives the shapes it expects.
  return sanitizeSection(key, { ...DEFAULTS[key], ...published }) as unknown as CmsContent[K];
}

/** Drops list entries the editor has marked "hidden". */
export function visible<T>(items: T[]): T[] {
  return items.filter((x) => !(x as any)?.hidden);
}

/** True when today is inside an optional start/end window (dates are YYYY-MM-DD). */
export function inDateWindow(start: string, end: string, today = new Date().toISOString().slice(0, 10)) {
  if (start && today < start) return false;
  if (end && today > end) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Editor reads / writes
// ---------------------------------------------------------------------------

export interface EditorState {
  key: SectionKey;
  /** What the editor should show: the draft if there is one, else published, else original. */
  value: Record<string, unknown>;
  hasDraft: boolean;
  isPublished: boolean;
  draftUpdatedAt: string | null;
  publishedAt: string | null;
}

export async function getEditorState(key: SectionKey): Promise<EditorState> {
  const row = await db.prepare(`SELECT * FROM cms_content WHERE key = ?`).get(key);
  const draft = parse(row?.draft);
  const published = parse(row?.published);
  const base = DEFAULTS[key] as Record<string, unknown>;
  return {
    key,
    value: sanitizeSection(key, { ...base, ...(published ?? {}), ...(draft ?? {}) }),
    hasDraft: !!draft,
    isPublished: !!published,
    draftUpdatedAt: row?.draft_updated_at ?? null,
    publishedAt: row?.published_at ?? null,
  };
}

export async function listSectionStatus() {
  const rows = await db.prepare(`SELECT key, draft IS NOT NULL AS has_draft, published IS NOT NULL AS is_published, published_at FROM cms_content`).all();
  const map: Record<string, { hasDraft: boolean; isPublished: boolean; publishedAt: string | null }> = {};
  for (const r of rows) map[r.key] = { hasDraft: !!r.has_draft, isPublished: !!r.is_published, publishedAt: r.published_at ?? null };
  return map;
}

export async function saveDraft(key: SectionKey, data: unknown, userId: string) {
  const clean = JSON.stringify(sanitizeSection(key, data));
  await db
    .prepare(
      `INSERT INTO cms_content (key, draft, draft_updated_at, draft_updated_by) VALUES (?, ?, ?, ?)
       ON CONFLICT (key) DO UPDATE SET draft = EXCLUDED.draft, draft_updated_at = EXCLUDED.draft_updated_at, draft_updated_by = EXCLUDED.draft_updated_by`
    )
    .run(key, clean, now(), userId);
}

/** Makes the given content live on the website and clears the draft. */
export async function publish(key: SectionKey, data: unknown, userId: string) {
  const clean = JSON.stringify(sanitizeSection(key, data));
  await db
    .prepare(
      `INSERT INTO cms_content (key, published, published_at, published_by, draft, draft_updated_at, draft_updated_by)
       VALUES (?, ?, ?, ?, NULL, NULL, NULL)
       ON CONFLICT (key) DO UPDATE SET published = EXCLUDED.published, published_at = EXCLUDED.published_at,
         published_by = EXCLUDED.published_by, draft = NULL, draft_updated_at = NULL, draft_updated_by = NULL`
    )
    .run(key, clean, now(), userId);
  clearContentCache();
}

/** Removes every edit: the website goes back to the original built-in content. */
export async function restoreOriginal(key: SectionKey) {
  await db.prepare(`DELETE FROM cms_content WHERE key = ?`).run(key);
  clearContentCache();
}

// ---------------------------------------------------------------------------
// Backup / restore
// ---------------------------------------------------------------------------

export async function exportContent() {
  const rows = await db.prepare(`SELECT key, draft, published, published_at FROM cms_content ORDER BY key`).all();
  const out: Record<string, { draft: unknown; published: unknown; publishedAt: string | null }> = {};
  for (const r of rows) out[r.key] = { draft: parse(r.draft), published: parse(r.published), publishedAt: r.published_at ?? null };
  return out;
}

/** Replaces all website content with what is in a backup file. Returns the sections restored. */
export async function importContent(content: unknown, userId: string): Promise<string[]> {
  if (!content || typeof content !== "object") throw new Error("This file has no website content in it.");
  const restored: string[] = [];
  await db.tx(async () => {
    await db.prepare(`DELETE FROM cms_content`).run();
    for (const key of SECTION_KEYS) {
      const entry = (content as any)[key];
      if (!entry || typeof entry !== "object") continue;
      const published = entry.published ? JSON.stringify(sanitizeSection(key, entry.published)) : null;
      const draft = entry.draft ? JSON.stringify(sanitizeSection(key, entry.draft)) : null;
      if (!published && !draft) continue;
      await db
        .prepare(
          `INSERT INTO cms_content (key, draft, published, draft_updated_at, draft_updated_by, published_at, published_by)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .run(key, draft, published, draft ? now() : null, draft ? userId : null, published ? now() : null, published ? userId : null);
      restored.push(key);
    }
  });
  clearContentCache();
  return restored;
}

export const isPrivateSection = (key: SectionKey) => PRIVATE_SECTIONS.includes(key);
export const isSectionKey = (key: string): key is SectionKey => (SECTION_KEYS as string[]).includes(key);
