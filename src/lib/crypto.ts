import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const key = () => {
  const secret = process.env.APP_SECRET;
  if (!secret && process.env.NODE_ENV === "production") throw new Error("APP_SECRET must be set in production");
  return createHash("sha256").update(secret || "dev-secret-change-me").digest();
};

/** AES-256-GCM, output is base64url(iv | tag | ciphertext). */
export function seal(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), enc]).toString("base64url");
}

export function unseal(token: string): string | null {
  try {
    const buf = Buffer.from(token, "base64url");
    const decipher = createDecipheriv("aes-256-gcm", key(), buf.subarray(0, 12));
    decipher.setAuthTag(buf.subarray(12, 28));
    return Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}
