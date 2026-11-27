import { webcrypto } from "node:crypto";
import { codeDigest, currentSlot, generateCode, qrToken, verifyQrToken } from "./crypto-tokens";
import { isValidP256PublicKey, signaturePayload, verifySignature } from "./device-signature";
import { CHECK_WEIGHTS, scoreStudent, type CheckInput } from "./scoring";

const SECRET = "test-secret";
const SESSION = "sess-1";
const INTERVAL = 10;

describe("AttendX QR tokens", () => {
  const now = 1_700_000_000_000;
  const slot = currentSlot(now, INTERVAL);

  it("accepts the current and previous slot, once signed", () => {
    expect(verifyQrToken(SECRET, SESSION, qrToken(SECRET, SESSION, slot), now, INTERVAL, 1)).toEqual({ ok: true, slot, slotAge: 0 });
    expect(verifyQrToken(SECRET, SESSION, qrToken(SECRET, SESSION, slot - 1), now, INTERVAL, 1)).toEqual({ ok: true, slot: slot - 1, slotAge: 1 });
  });

  it("rejects stale tokens (screenshot replay) and future tokens", () => {
    const stale = verifyQrToken(SECRET, SESSION, qrToken(SECRET, SESSION, slot - 2), now, INTERVAL, 1);
    expect(stale.ok).toBe(false);
    expect(!stale.ok && stale.reason).toBe("EXPIRED");
    const future = verifyQrToken(SECRET, SESSION, qrToken(SECRET, SESSION, slot + 1), now, INTERVAL, 1);
    expect(!future.ok && future.reason).toBe("FUTURE");
  });

  it("rejects tokens minted with another secret or for another session", () => {
    const wrongSecret = verifyQrToken(SECRET, SESSION, qrToken("other", SESSION, slot), now, INTERVAL, 1);
    expect(!wrongSecret.ok && wrongSecret.reason).toBe("BAD_MAC");
    const wrongSession = verifyQrToken(SECRET, SESSION, qrToken(SECRET, "sess-2", slot), now, INTERVAL, 1);
    expect(!wrongSession.ok && wrongSession.reason).toBe("BAD_MAC");
  });

  it("rejects malformed input", () => {
    for (const bad of ["", "abc", "12.short", `${slot}.${"x".repeat(40)}`]) {
      expect(verifyQrToken(SECRET, SESSION, bad, now, INTERVAL, 1).ok).toBe(false);
    }
  });

  it("allows a larger slot age for a late-network resubmit", () => {
    expect(verifyQrToken(SECRET, SESSION, qrToken(SECRET, SESSION, slot - 5), now, INTERVAL, 6).ok).toBe(true);
  });
});

describe("room codes", () => {
  it("generates codes of the requested length from the safe alphabet", () => {
    for (let i = 0; i < 50; i++) expect(/^[A-HJKMNP-Z2-9]{5}$/.test(generateCode(5))).toBe(true);
  });

  it("digests are case-insensitive, per check, and keyed", () => {
    expect(codeDigest(SECRET, "c1", "ab7k2")).toBe(codeDigest(SECRET, "c1", " AB7K2 "));
    expect(codeDigest(SECRET, "c1", "AB7K2")).not.toBe(codeDigest(SECRET, "c2", "AB7K2"));
    expect(codeDigest(SECRET, "c1", "AB7K2")).not.toBe(codeDigest("other", "c1", "AB7K2"));
  });
});

describe("device signatures", () => {
  async function newDevice() {
    const pair = await webcrypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
    const spki = Buffer.from(await webcrypto.subtle.exportKey("spki", pair.publicKey)).toString("base64");
    const sign = async (payload: string) =>
      Buffer.from(await webcrypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, pair.privateKey, Buffer.from(payload))).toString("base64");
    return { spki, sign };
  }

  it("verifies a WebCrypto signature and rejects tampering", async () => {
    const { spki, sign } = await newDevice();
    const payload = signaturePayload({ checkId: "c1", nonce: "n1", qrToken: "5.abc", answer: "ab7k2" });
    const sig = await sign(payload);
    expect(verifySignature(spki, payload, sig)).toBe(true);
    expect(verifySignature(spki, signaturePayload({ checkId: "c1", nonce: "n2", qrToken: "5.abc", answer: "ab7k2" }), sig)).toBe(false);
    expect(verifySignature(spki, signaturePayload({ checkId: "c2", nonce: "n1", qrToken: "5.abc", answer: "ab7k2" }), sig)).toBe(false);
  });

  it("rejects a signature from a different device key", async () => {
    const a = await newDevice();
    const b = await newDevice();
    const payload = signaturePayload({ checkId: "c1", nonce: "n1" });
    expect(verifySignature(b.spki, payload, await a.sign(payload))).toBe(false);
  });

  it("accepts only P-256 SPKI public keys", async () => {
    const { spki } = await newDevice();
    expect(isValidP256PublicKey(spki)).toBe(true);
    expect(isValidP256PublicKey("not-a-key")).toBe(false);
    const p384 = await webcrypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-384" }, true, ["sign", "verify"]);
    expect(isValidP256PublicKey(Buffer.from(await webcrypto.subtle.exportKey("spki", p384.publicKey)).toString("base64"))).toBe(false);
  });
});

describe("AttendX scoring", () => {
  const checks: CheckInput[] = [
    { id: "i", kind: "INITIAL", weight: CHECK_WEIGHTS.INITIAL },
    { id: "c", kind: "CODE", weight: CHECK_WEIGHTS.CODE },
    { id: "p1", kind: "PING", weight: CHECK_WEIGHTS.PING },
    { id: "p2", kind: "PING", weight: CHECK_WEIGHTS.PING },
  ];

  it("proposes PRESENT when every check passes", () => {
    expect(scoreStudent(checks, { i: "PASS", c: "PASS", p1: "PASS", p2: "PASS" }, [], 0.75).proposed).toBe("PRESENT");
  });

  it("tolerates one missed re-ping (score 0.8)", () => {
    const r = scoreStudent(checks, { i: "PASS", c: "PASS", p1: "PASS" }, [], 0.75);
    expect(r.proposed).toBe("PRESENT");
    expect(r.score).toBe(0.8);
  });

  it("sends a student who scanned and then left to REVIEW, never straight to ABSENT", () => {
    const r = scoreStudent(checks, { i: "PASS" }, [], 0.75);
    expect(r.proposed).toBe("REVIEW");
  });

  it("proposes ABSENT only when nothing valid reached the server", () => {
    expect(scoreStudent(checks, {}, [], 0.75).proposed).toBe("ABSENT");
  });

  it("sends a student whose QR scan failed but who answered the room code to REVIEW", () => {
    expect(scoreStudent(checks, { c: "PASS", p1: "PASS", p2: "PASS" }, [], 0.75).proposed).toBe("REVIEW");
  });

  it("downgrades PRESENT to REVIEW when two soft flags fire", () => {
    const all = { i: "PASS", c: "PASS", p1: "PASS", p2: "PASS" } as const;
    expect(scoreStudent(checks, all, ["FAST_SCAN"], 0.75).proposed).toBe("PRESENT");
    expect(scoreStudent(checks, all, ["FAST_SCAN", "SHARED_CLUSTER"], 0.75).proposed).toBe("REVIEW");
  });

  it("counts a late-network resubmit as half credit", () => {
    expect(scoreStudent([checks[0]], { i: "LATE_OK" }, ["LATE_NETWORK"], 0.75).proposed).toBe("REVIEW");
  });
});
