import { createHash, createHmac, randomInt, timingSafeEqual } from "node:crypto";

// Dependency-free helpers for AttendX. No I/O, no database: everything here is a pure function so it
// can be unit-tested without a server.

/** Unambiguous characters only (no 0/O, 1/I/L) so a code read off a board is typed correctly. */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateCode(length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

export function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export const currentSlot = (nowMs: number, intervalSec: number) => Math.floor(nowMs / (intervalSec * 1000));

/** QR payload: `<slot>.<mac>`. The mac covers the session id and slot, keyed by a per-session server secret. */
export function qrToken(secret: string, sessionId: string, slot: number): string {
  const mac = createHmac("sha256", secret).update(`qr:${sessionId}:${slot}`).digest("base64url").slice(0, 22);
  return `${slot}.${mac}`;
}

export type QrVerdict =
  | { ok: true; slot: number; slotAge: number }
  | { ok: false; reason: "MALFORMED" | "BAD_MAC" | "FUTURE" | "EXPIRED" };

/** `maxSlotAge` = how many slots old a token may be (1 = current or previous slot). */
export function verifyQrToken(
  secret: string,
  sessionId: string,
  token: string,
  nowMs: number,
  intervalSec: number,
  maxSlotAge: number,
): QrVerdict {
  const m = /^(\d{1,12})\.([A-Za-z0-9_-]{22})$/.exec(token ?? "");
  if (!m) return { ok: false, reason: "MALFORMED" };
  const slot = Number(m[1]);
  if (!safeEqual(qrToken(secret, sessionId, slot), token)) return { ok: false, reason: "BAD_MAC" };
  const slotAge = currentSlot(nowMs, intervalSec) - slot;
  if (slotAge < 0) return { ok: false, reason: "FUTURE" };
  if (slotAge > maxSlotAge) return { ok: false, reason: "EXPIRED" };
  return { ok: true, slot, slotAge };
}

/** Keyed digest of a room code, so the database never holds the code itself. Case-insensitive. */
export function codeDigest(secret: string, checkId: string, code: string): string {
  return createHmac("sha256", secret).update(`code:${checkId}:${code.trim().toUpperCase()}`).digest("base64url");
}
