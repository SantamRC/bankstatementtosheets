/**
 * Password-protected PDFs (most Indian bank e-statements), unlocked in the browser.
 *
 * The password never leaves the device: we decrypt with @cantoo/pdf-lib (pdf.js's cipher code; RC4, AES-128 and
 * AES-256 all work) and upload only the unlocked copy. The library is loaded lazily, and only when the file contains
 * an /Encrypt entry, so ordinary uploads pay nothing.
 *
 * Kept free of "@/" imports so scripts/test-unlock.ts can run it with plain node.
 */

import type { PDFDict as PdfDict } from "@cantoo/pdf-lib";

export type UnlockResult = { ok: true; bytes: Uint8Array; wasLocked: boolean } | { ok: false; reason: "needs_password" | "wrong_password" | "unreadable" };

const ENCRYPT = [0x2f, 0x45, 0x6e, 0x63, 0x72, 0x79, 0x70, 0x74]; // "/Encrypt"

/** Cheap pre-check: an encrypted PDF has "/Encrypt" in its trailer. False positives just cost one parse. */
export function mayBeEncrypted(bytes: Uint8Array): boolean {
  outer: for (let i = 0; i <= bytes.length - ENCRYPT.length; i++) {
    for (let k = 0; k < ENCRYPT.length; k++) if (bytes[i + k] !== ENCRYPT[k]) continue outer;
    return true;
  }
  return false;
}

/**
 * Returns the bytes to upload. With no password, an encrypted file is first tried with the empty password (many
 * statements are only "owner"-locked against printing/copying); if that fails the caller must ask for one.
 */
export async function unlockPdf(bytes: Uint8Array, password?: string): Promise<UnlockResult> {
  if (password === undefined && !mayBeEncrypted(bytes)) return { ok: true, bytes, wasLocked: false };
  const { PDFDocument, PDFDict, PDFName, PDFStream } = await import("@cantoo/pdf-lib");

  if (password === undefined) {
    let encrypted: boolean;
    try {
      encrypted = (await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false })).isEncrypted;
    } catch {
      return { ok: false, reason: "unreadable" };
    }
    if (!encrypted) return { ok: true, bytes, wasLocked: false };
  }

  // Bank rules differ in case ("AMIT0101" vs "amit0101"), so a wrong-case guess is retried once in the other case.
  const tries = password === undefined ? [""] : [...new Set([password, password.trim(), password.trim().toUpperCase(), password.trim().toLowerCase()])];
  for (const pw of tries) {
    try {
      const doc = await PDFDocument.load(bytes, { password: pw, updateMetadata: false });
      // The decrypted document still holds the old encryption dictionary and, for files with xref streams, the old
      // xref-stream dict whose /Encrypt entry makes the copy look locked again. Drop both before saving.
      const isType = (d: PdfDict, k: string, v: string) => d.get(PDFName.of(k)) === PDFName.of(v);
      for (const [ref, obj] of doc.context.enumerateIndirectObjects()) {
        const dict = obj instanceof PDFDict ? obj : obj instanceof PDFStream ? obj.dict : null;
        if (dict && (isType(dict, "Type", "XRef") || isType(dict, "Filter", "Standard") || dict.has(PDFName.of("Encrypt")))) doc.context.delete(ref);
      }
      return { ok: true, bytes: await doc.save({ useObjectStreams: false }), wasLocked: true };
    } catch {
      // wrong password, try the next variant
    }
  }
  return { ok: false, reason: password === undefined ? "needs_password" : "wrong_password" };
}
