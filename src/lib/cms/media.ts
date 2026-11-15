import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { get, put } from "@vercel/blob";
import { db } from "@/lib/db";
import { MIME, STORAGE_ROOT, sniffType, stripImageMetadata, type SniffedType } from "@/lib/storage";

/**
 * Pictures uploaded through the website editor (popup image, share images).
 *
 * Stored the same way as delivery photos: in Vercel Blob on Vercel, in the
 * local uploads folder otherwise, and served through /api/cms/media/<name>.
 * The browser already shrinks pictures before uploading; the limits below
 * are the server's own, and it never trusts the browser's file type.
 */

const useBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL);
const MEDIA_DIR = path.join(STORAGE_ROOT, "cms");
const blobPath = (name: string) => `swiftdrop/cms/${name}`;
const NAME_PATTERN = /^[0-9a-f-]{36}\.(jpeg|png|webp)$/;

export const MAX_MEDIA_BYTES = 2 * 1024 * 1024;

export async function saveCmsImage(bytes: Buffer, userId: string): Promise<{ url: string } | { error: string }> {
  if (bytes.length > MAX_MEDIA_BYTES) return { error: "That picture is too large (2 MB maximum)." };
  const type = sniffType(bytes);
  if (!type || type === "pdf") return { error: "Only JPG, PNG or WebP pictures can be uploaded." };
  const name = `${randomUUID()}.${type}`;
  const clean = stripImageMetadata(bytes, type);
  if (useBlob) {
    await put(blobPath(name), clean, { access: "private", contentType: MIME[type] });
  } else {
    fs.mkdirSync(MEDIA_DIR, { recursive: true });
    fs.writeFileSync(path.join(MEDIA_DIR, name), clean);
  }
  await db
    .prepare(`INSERT INTO cms_media (name, mime, bytes, uploaded_by, created_at) VALUES (?, ?, ?, ?, ?)`)
    .run(name, MIME[type], clean.length, userId, new Date().toISOString());
  return { url: `/api/cms/media/${name}` };
}

export async function readCmsImage(name: string): Promise<{ bytes: Buffer; mime: string } | null> {
  const safe = path.basename(name);
  if (!NAME_PATTERN.test(safe)) return null;
  const mime = MIME[safe.split(".").pop() as SniffedType];
  if (useBlob) {
    const result = await get(blobPath(safe), { access: "private", useCache: true });
    if (!result || result.statusCode !== 200 || !result.stream) return null;
    const reader = result.stream.getReader();
    const chunks: Buffer[] = [];
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(Buffer.from(value));
    }
    return { bytes: Buffer.concat(chunks), mime };
  }
  const p = path.join(MEDIA_DIR, safe);
  if (!fs.existsSync(p)) return null;
  return { bytes: fs.readFileSync(p), mime };
}
