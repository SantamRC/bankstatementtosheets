// Run: node scripts/test-unlock.ts
import assert from "node:assert/strict";
import { PDFDocument as Locker, StandardFonts } from "@cantoo/pdf-lib";
import { PDFDocument } from "pdf-lib";
import { mayBeEncrypted, unlockPdf } from "../src/lib/pdf-unlock.ts";

async function locked(algorithm: "RC4-128" | "AES-128" | "AES-256", userPassword: string) {
  const d = await Locker.create();
  const font = await d.embedFont(StandardFonts.Helvetica);
  d.addPage().drawText("UPI-SWIGGY 1,250.00", { x: 50, y: 700, font, size: 12 });
  d.encrypt({ userPassword, ownerPassword: "owner-secret", algorithm, allowWeakCryptography: true });
  return d.save();
}

// 1. Plain PDFs pass straight through, untouched
const plain = await (await PDFDocument.create()).save();
assert.equal(mayBeEncrypted(plain), false);
let r = await unlockPdf(plain);
assert.ok(r.ok && !r.wasLocked && r.bytes === plain);

// 2. Every common cipher: no password → asks; wrong → rejected; right → an unlocked copy our server's pdf-lib can read
for (const alg of ["RC4-128", "AES-128", "AES-256"] as const) {
  const bytes = await locked(alg, "AMIT0101");
  assert.ok(mayBeEncrypted(bytes));
  await assert.rejects(PDFDocument.load(bytes), /encrypt/i, `${alg}: server rejects the locked file`);
  r = await unlockPdf(bytes);
  assert.deepEqual(r, { ok: false, reason: "needs_password" }, alg);
  r = await unlockPdf(bytes, "nope");
  assert.deepEqual(r, { ok: false, reason: "wrong_password" }, alg);
  r = await unlockPdf(bytes, "AMIT0101");
  assert.ok(r.ok && r.wasLocked, alg);
  assert.equal((await PDFDocument.load(r.bytes)).getPageCount(), 1, `${alg}: unlocked copy loads`);
  const again = await unlockPdf(r.bytes);
  assert.ok(again.ok && !again.wasLocked, `${alg}: unlocked copy is not seen as locked again`);
}

// 3. Case and stray spaces are forgiven
const aes = await locked("AES-128", "AMIT0101");
assert.ok((await unlockPdf(aes, " amit0101 ")).ok);

// 4. Owner-only lock (empty open password) is unlocked without asking
r = await unlockPdf(await locked("AES-128", ""));
assert.ok(r.ok && r.wasLocked);

console.log("unlock: all tests passed");
