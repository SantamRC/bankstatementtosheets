// Run: node scripts/test-ofx.ts
import assert from "node:assert/strict";
import { ofxText, toOfxFiles } from "../src/lib/export/ofx.ts";
import type { Statement, Transaction } from "../src/lib/extraction/schema.ts";

const tx = (p: Partial<Transaction>): Transaction => ({
  id: "x", date: "2026-10-02", description: "POS SHELL OIL 5742", payee: "Shell", reference: null,
  debit: null, credit: null, balance: null, category: "Transport", page: 1, status: "verified", ...p,
});
const base = (p: Partial<Statement>): Statement => ({
  id: "s", fileName: "a.pdf", pages: 1, bankName: "Northwind Bank", accountHolder: null, accountLast4: "2219", accountType: "checking",
  currency: "USD", periodStart: "2026-10-01", periodEnd: "2026-10-31", openingBalance: 1000, closingBalance: 2451.28, notes: [],
  reconciliation: { status: "verified", direction: "asset" } as Statement["reconciliation"],
  transactions: [],
  ...p,
});
const now = new Date(Date.UTC(2026, 10, 14, 9, 30, 0));

// 1. Checking account → bank statement OFX, signed amounts, ledger balance, no INTU.BID in plain OFX
const checking = base({
  transactions: [
    tx({ debit: 48.72 }),
    tx({ date: "2026-10-01", description: "PAYROLL ACME & SONS <OCT>", payee: "Acme payroll", credit: 1500, category: "Payroll" }),
    tx({ date: "2026-10-30", description: "MONTHLY SERVICE FEE", payee: "Service fee", debit: 12, category: "Fees & Charges" }),
    tx({ date: "2026-10-12", description: "CHECK 1043", payee: "Check 1043", reference: "1043", debit: 200, category: "Other" }),
    tx({ debit: 0 }), // zero rows skipped
  ],
});
let [f] = toOfxFiles([checking], { flavor: "ofx", now });
assert.match(f.content, /^OFXHEADER:100\r\n/);
assert.ok(f.content.includes("<BANKMSGSRSV1>") && !f.content.includes("CREDITCARDMSGSRSV1"));
assert.ok(!f.content.includes("INTU.BID"));
assert.equal(f.transactions, 4);
assert.ok(f.content.includes("<TRNAMT>-48.72") && f.content.includes("<TRNAMT>1500.00"));
assert.ok(f.content.includes("<TRNTYPE>FEE"));
assert.ok(f.content.includes("<TRNTYPE>CHECK") && f.content.includes("<CHECKNUM>1043"));
assert.ok(f.content.includes("ACME &amp; SONS &lt;OCT&gt;"), "SGML specials escaped");
assert.ok(f.content.includes("<BALAMT>2451.28"));
assert.ok(f.content.includes("<DTSTART>20261001120000") && f.content.includes("<DTEND>20261031120000"));
assert.ok(f.content.includes("<DTSERVER>20261114093000"));
assert.ok(f.filename.endsWith(".ofx"));
// rows are chronological
assert.ok(f.content.indexOf("<TRNAMT>1500.00") < f.content.indexOf("<TRNAMT>-48.72"));

// 2. QBO flavour adds Intuit's bank code
[f] = toOfxFiles([checking], { flavor: "qbo", now });
assert.ok(f.content.includes("<INTU.BID>3000") && f.filename.endsWith(".qbo"));

// 3. FITIDs are stable across exports and unique for identical rows
const dup = base({ transactions: [tx({ debit: 5 }), tx({ debit: 5 })] });
const a = toOfxFiles([dup], { flavor: "ofx", now })[0].content.match(/<FITID>(\w+)/g)!;
const b = toOfxFiles([dup], { flavor: "ofx", now: new Date() })[0].content.match(/<FITID>(\w+)/g)!;
assert.deepEqual(a, b);
assert.equal(new Set(a).size, 2);

// 4. Credit card → CC statement, charges negative, owed balance negative
const card = base({
  bankName: "Amex", accountLast4: "1008", accountType: "credit_card", closingBalance: 730.97,
  reconciliation: { status: "verified", direction: "liability" } as Statement["reconciliation"],
  transactions: [tx({ debit: 428.9, payee: "Delta" }), tx({ date: "2026-10-03", description: "PAYMENT RECEIVED", payee: "Card payment", credit: 1250, category: "Transfer" })],
});
[f] = toOfxFiles([card], { flavor: "qbo", now });
assert.ok(f.content.includes("<CREDITCARDMSGSRSV1>") && f.content.includes("<CCACCTFROM>") && !f.content.includes("<BANKID>"));
assert.ok(f.content.includes("<TRNAMT>-428.90") && f.content.includes("<TRNAMT>1250.00"));
assert.ok(f.content.includes("<BALAMT>-730.97"));

// 5. Two statements of the same account merge into one file; a different account gets its own
const nov = base({ periodStart: "2026-11-01", periodEnd: "2026-11-30", closingBalance: 99, transactions: [tx({ date: "2026-11-03", debit: 1 })] });
const files = toOfxFiles([checking, nov, card], { flavor: "ofx", now });
assert.equal(files.length, 2);
assert.equal(files[0].transactions, 5);
assert.ok(files[0].content.includes("<BALAMT>99.00"), "ledger balance comes from the latest statement");

// 6. Clean style uses the payee as NAME and keeps the bank text in MEMO; non-ASCII is made safe
[f] = toOfxFiles([base({ currency: "inr", transactions: [tx({ description: "UPI-Café Zoë ₹ 627512345678", payee: "Café Zoë", debit: 100 })] })], { flavor: "ofx", style: "clean", now });
assert.ok(f.content.includes("<NAME>Cafe Zoe") && f.content.includes("<MEMO>UPI-Cafe Zoe"));
assert.ok(f.content.includes("<CURDEF>INR"));
assert.ok(!/[^\x00-\x7F]/.test(f.content), "pure ASCII");
assert.equal(ofxText("x".repeat(40), 32).length, 32);

console.log("ofx: all tests passed");
