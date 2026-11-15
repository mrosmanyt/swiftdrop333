import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { del, get, head, put } from "@vercel/blob";

/**
 * File storage for user uploads.
 *
 * Two problems this fixes:
 *
 * 1. Persistence. Uploads used to be written to <app>/public/uploads and
 *    <app>/private-uploads — neither is on the Railway volume (only /app/data
 *    is), so every redeploy silently wiped every delivery photo and every
 *    courier licence. And Next.js only serves files that existed in public/
 *    at build time, so runtime uploads to public/ were never reachable in
 *    production anyway. Everything now lives next to the database, on the
 *    same persistent volume, and is served through API routes.
 *
 * 2. Sensitive data at rest. Identity documents (driver's licence,
 *    insurance, registration) are encrypted with AES-256-GCM before they
 *    touch the disk, so the volume — and any backup or snapshot of it —
 *    only ever holds ciphertext. Delivery photos have their EXIF metadata
 *    (which includes the GPS coordinates of the customer's door and the
 *    courier's phone model) stripped before saving.
 */

const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

// Local development / self-hosting only — on Vercel uploads go to private
// Vercel Blob (see useBlob below), because there is no writable disk.
export const STORAGE_ROOT = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "data", "uploads");
const DOCUMENT_DIR = path.join(STORAGE_ROOT, "documents");
const POD_DIR = path.join(STORAGE_ROOT, "pod");

/** Where documents were written before this change (plaintext). Read-only fallback. */
const LEGACY_DOCUMENT_DIR = path.join(process.cwd(), "private-uploads");
const useBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL);
const BLOB_PREFIX = "blob:";

function blobPath(kind: "documents" | "pod", name: string) {
  return `swiftdrop/${kind}/${name}`;
}

async function streamBuffer(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const chunks: Buffer[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks);
}

if (!isBuildPhase) {
  fs.mkdirSync(DOCUMENT_DIR, { recursive: true });
  fs.mkdirSync(POD_DIR, { recursive: true });
}

// ---------------------------------------------------------------------------
// File-type sniffing — never trust the browser-supplied MIME type.
// ---------------------------------------------------------------------------

export type SniffedType = "jpeg" | "png" | "webp" | "pdf";

export function sniffType(buf: Buffer): SniffedType | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpeg";
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buf.length >= 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "webp";
  if (buf.length >= 5 && buf.toString("ascii", 0, 5) === "%PDF-") return "pdf";
  return null;
}

export const MIME: Record<SniffedType, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  pdf: "application/pdf",
};

// ---------------------------------------------------------------------------
// Metadata stripping for photos.
// ---------------------------------------------------------------------------

/** Removes EXIF/XMP/IPTC (APP1, APP13) and comment segments from a JPEG. */
function stripJpeg(buf: Buffer): Buffer {
  const out: Buffer[] = [buf.subarray(0, 2)]; // SOI
  let i = 2;
  while (i + 4 <= buf.length) {
    if (buf[i] !== 0xff) return buf; // not a marker where one should be — leave the file alone
    const marker = buf[i + 1];
    if (marker === 0xda) {
      // Start of scan: the rest is image data.
      out.push(buf.subarray(i));
      return Buffer.concat(out);
    }
    const len = buf.readUInt16BE(i + 2);
    const segEnd = i + 2 + len;
    if (segEnd > buf.length) return buf;
    const drop = marker === 0xe1 || marker === 0xed || marker === 0xfe; // APP1, APP13, COM
    if (!drop) out.push(buf.subarray(i, segEnd));
    i = segEnd;
  }
  return buf;
}

/** Removes eXIf / tEXt / iTXt / zTXt metadata chunks from a PNG. */
function stripPng(buf: Buffer): Buffer {
  const out: Buffer[] = [buf.subarray(0, 8)];
  let i = 8;
  while (i + 12 <= buf.length) {
    const len = buf.readUInt32BE(i);
    const type = buf.toString("ascii", i + 4, i + 8);
    const end = i + 12 + len;
    if (end > buf.length) return buf;
    if (!["eXIf", "tEXt", "iTXt", "zTXt"].includes(type)) out.push(buf.subarray(i, end));
    i = end;
  }
  return Buffer.concat(out);
}

/** Removes EXIF and XMP chunks from a WebP (RIFF container). */
function stripWebp(buf: Buffer): Buffer {
  const chunks: Buffer[] = [];
  let i = 12;
  while (i + 8 <= buf.length) {
    const type = buf.toString("ascii", i, i + 4);
    const len = buf.readUInt32LE(i + 4);
    const end = i + 8 + len + (len % 2);
    if (end > buf.length + 1) return buf;
    if (type !== "EXIF" && type !== "XMP ") chunks.push(buf.subarray(i, Math.min(end, buf.length)));
    i = end;
  }
  const body = Buffer.concat(chunks);
  const header = Buffer.alloc(12);
  header.write("RIFF", 0, "ascii");
  header.writeUInt32LE(body.length + 4, 4);
  header.write("WEBP", 8, "ascii");
  // The VP8X feature flags may still advertise EXIF/XMP; clear those bits.
  const vp8x = body.indexOf("VP8X");
  if (vp8x === 0 && body.length > 8) body[8] &= ~(0x08 | 0x04);
  return Buffer.concat([header, body]);
}

export function stripImageMetadata(buf: Buffer, type: SniffedType): Buffer {
  try {
    if (type === "jpeg") return stripJpeg(buf);
    if (type === "png") return stripPng(buf);
    if (type === "webp") return stripWebp(buf);
  } catch {
    // A malformed file: fall through and keep it unmodified rather than crash the upload.
  }
  return buf;
}

// ---------------------------------------------------------------------------
// Encryption at rest for identity documents.
// ---------------------------------------------------------------------------

const ENC_MAGIC = Buffer.from("SDENC1");

function encryptionKey(): Buffer {
  const explicit = process.env.DATA_ENCRYPTION_KEY;
  if (explicit) return createHash("sha256").update(explicit).digest();
  const secret = process.env.NEXTAUTH_SECRET;
  if (secret) return createHash("sha256").update(`swiftdrop-documents:${secret}`).digest();
  if (process.env.NODE_ENV === "production" && !isBuildPhase) {
    throw new Error("Set DATA_ENCRYPTION_KEY (or NEXTAUTH_SECRET) before storing documents.");
  }
  return createHash("sha256").update("swiftdrop-dev-only-key").digest();
}

function encrypt(plain: Buffer): Buffer {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const body = Buffer.concat([cipher.update(plain), cipher.final()]);
  return Buffer.concat([ENC_MAGIC, iv, cipher.getAuthTag(), body]);
}

function decrypt(blob: Buffer): Buffer {
  if (!blob.subarray(0, ENC_MAGIC.length).equals(ENC_MAGIC)) return blob; // legacy plaintext
  const iv = blob.subarray(6, 18);
  const tag = blob.subarray(18, 34);
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(blob.subarray(34)), decipher.final()]);
}

const SAFE_NAME = /^[0-9a-f-]{36}\.(jpeg|png|webp|pdf)(\.enc)?$/;

/** Encrypts and stores an identity document. Returns the stored file name. */
export async function saveDocument(bytes: Buffer, type: SniffedType): Promise<string> {
  const clean = type === "pdf" ? bytes : stripImageMetadata(bytes, type);
  const name = `${randomUUID()}.${type}.enc`;
  const encrypted = encrypt(clean);
  if (useBlob) {
    const pathname = blobPath("documents", name);
    await put(pathname, encrypted, { access: "private", contentType: "application/octet-stream" });
    return `${BLOB_PREFIX}${pathname}`;
  }
  fs.writeFileSync(path.join(DOCUMENT_DIR, name), encrypted, { mode: 0o600 });
  return name;
}

/** Reads (and decrypts) a stored document, or null if the file is gone. */
export async function readDocument(storedName: string): Promise<{ bytes: Buffer; mime: string } | null> {
  if (storedName.startsWith(BLOB_PREFIX)) {
    const pathname = storedName.slice(BLOB_PREFIX.length);
    if (!pathname.startsWith("swiftdrop/documents/")) return null;
    const name = path.basename(pathname);
    if (!SAFE_NAME.test(name)) return null;
    const result = await get(pathname, { access: "private", useCache: false });
    if (!result || result.statusCode !== 200 || !result.stream) return null;
    const ext = name.replace(/\.enc$/, "").split(".").pop() as SniffedType;
    return { bytes: decrypt(await streamBuffer(result.stream)), mime: MIME[ext] ?? "application/octet-stream" };
  }
  const name = path.basename(storedName);
  if (!SAFE_NAME.test(name)) return null;
  const ext = name.replace(/\.enc$/, "").split(".").pop() as SniffedType;
  for (const dir of [DOCUMENT_DIR, LEGACY_DOCUMENT_DIR]) {
    const p = path.join(dir, name);
    if (fs.existsSync(p)) {
      return { bytes: decrypt(fs.readFileSync(p)), mime: MIME[ext] ?? "application/octet-stream" };
    }
  }
  return null;
}

/** Permanently removes a stored document file (both locations). */
export async function deleteDocumentFile(storedName: string | null | undefined) {
  if (!storedName) return;
  if (storedName.startsWith(BLOB_PREFIX)) {
    const pathname = storedName.slice(BLOB_PREFIX.length);
    if (pathname.startsWith("swiftdrop/documents/")) await del(pathname);
    return;
  }
  const name = path.basename(storedName);
  if (!SAFE_NAME.test(name)) return;
  for (const dir of [DOCUMENT_DIR, LEGACY_DOCUMENT_DIR]) {
    try {
      fs.unlinkSync(path.join(dir, name));
    } catch {
      /* already gone */
    }
  }
}

// ---------------------------------------------------------------------------
// Proof-of-delivery photos.
// ---------------------------------------------------------------------------

export const POD_URL_PATTERN = /^\/api\/pod\/[0-9a-f-]{36}\.(jpeg|png|webp)$/;

export async function savePodPhoto(bytes: Buffer, type: SniffedType): Promise<string> {
  const name = `${randomUUID()}.${type}`;
  const clean = stripImageMetadata(bytes, type);
  if (useBlob) {
    await put(blobPath("pod", name), clean, { access: "private", contentType: MIME[type] });
  } else {
    fs.writeFileSync(path.join(POD_DIR, name), clean, { mode: 0o600 });
  }
  return `/api/pod/${name}`;
}

export async function podFileExists(url: string): Promise<boolean> {
  if (!POD_URL_PATTERN.test(url)) return false;
  if (useBlob) {
    try {
      await head(blobPath("pod", path.basename(url)));
      return true;
    } catch {
      return false;
    }
  }
  return fs.existsSync(path.join(POD_DIR, path.basename(url)));
}

export async function readPodPhoto(name: string): Promise<{ bytes: Buffer; mime: string } | null> {
  const safe = path.basename(name);
  if (!POD_URL_PATTERN.test(`/api/pod/${safe}`)) return null;
  if (useBlob) {
    const result = await get(blobPath("pod", safe), { access: "private", useCache: true });
    if (!result || result.statusCode !== 200 || !result.stream) return null;
    const ext = safe.split(".").pop() as SniffedType;
    return { bytes: await streamBuffer(result.stream), mime: MIME[ext] };
  }
  const p = path.join(POD_DIR, safe);
  if (!fs.existsSync(p)) return null;
  const ext = safe.split(".").pop() as SniffedType;
  return { bytes: fs.readFileSync(p), mime: MIME[ext] };
}

export async function deletePodPhoto(url: string | null | undefined) {
  if (!url || !POD_URL_PATTERN.test(url)) return;
  if (useBlob) {
    await del(blobPath("pod", path.basename(url)));
    return;
  }
  try {
    fs.unlinkSync(path.join(POD_DIR, path.basename(url)));
  } catch {
    /* already gone */
  }
}

/** Header-safe filename for Content-Disposition. */
export function safeDownloadName(name: string | null | undefined, fallback: string) {
  const cleaned = (name ?? "").replace(/[^A-Za-z0-9._ -]/g, "_").slice(0, 80).trim();
  return cleaned || fallback;
}
