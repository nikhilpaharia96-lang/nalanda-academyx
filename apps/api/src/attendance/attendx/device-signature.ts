import { createPublicKey, verify } from "node:crypto";

// The student's phone holds a non-extractable ECDSA P-256 key (WebCrypto). Every submission is signed
// with it over a payload that includes a one-time server nonce, so a captured request cannot be replayed.

function toKey(spkiBase64: string) {
  return createPublicKey({ key: Buffer.from(spkiBase64, "base64"), format: "der", type: "spki" });
}

export function isValidP256PublicKey(spkiBase64: string): boolean {
  try {
    const k = toKey(spkiBase64);
    return k.asymmetricKeyType === "ec" && k.asymmetricKeyDetails?.namedCurve === "prime256v1";
  } catch {
    return false;
  }
}

/** Canonical string the client signs. Must match exactly on both sides. */
export function signaturePayload(p: { checkId: string; nonce: string; qrToken?: string | null; answer?: string | null }): string {
  return ["attx1", p.checkId, p.nonce, p.qrToken ?? "", (p.answer ?? "").trim().toUpperCase()].join("|");
}

/** WebCrypto's ECDSA output is raw r||s (IEEE P1363), not DER. */
export function verifySignature(spkiBase64: string, payload: string, signatureBase64: string): boolean {
  try {
    return verify("sha256", Buffer.from(payload), { key: toKey(spkiBase64), dsaEncoding: "ieee-p1363" }, Buffer.from(signatureBase64, "base64"));
  } catch {
    return false;
  }
}
