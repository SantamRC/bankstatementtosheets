// Run: node scripts/test-tally.ts
import assert from "node:assert/strict";
import { accountKey, tallyLedgersUsed, tallyVouchers, toTallyXml } from "../src/lib/export/tally.ts";
import type { Statement, Transaction } from "../src/lib/extraction/schema.ts";

const tx = (p: Partial<Transaction>): Transaction => ({
  id: "x", date: "2026-10-02", description: "UPI-SWIGGY-627512345678", payee: "Swiggy", reference: "627512345678",
  debit: null, credit: null, balance: null, category: "Other", page: 1, status: "verified", ...p,
});
const st: Statement = {
  id: "s", fileName: "hdfc.pdf", pages: 1, bankName: "HDFC Bank", accountHolder: null, accountLast4: "4821", accountType: "savings",
  currency: "INR", periodStart: null, periodEnd: null, openingBalance: null, closingBalance: null, notes: [],
  reconciliation: { status: "verified" } as Statement["reconciliation"],
  transactions: [
    tx({ debit: 486, category: "Dining" }),
    tx({ date: "2026-10-01", description: "NEFT CR-ACME & SONS <SALARY>", payee: "Acme salary", reference: null, credit: 85000, category: "Payroll" }),
    tx({ date: "2026-10-05", description: "ATW-512345XXXXXX9876", payee: "ATM withdrawal", reference: null, debit: 10000, category: "Cash" }),
    tx({ debit: 0, credit: 0 }), // zero rows are skipped
  ],
};
const opts = {
  bankLedgers: { [accountKey(st)]: "HDFC Bank A/c" },
  defaultLedger: "Suspense",
  categoryLedgers: { Dining: "Staff Welfare", Cash: "Cash" } as const,
  cashLedgers: ["Cash"],
};

const v = tallyVouchers([st], opts);
assert.equal(v.length, 3);
assert.deepEqual(
  v.map((x) => [x.type, x.debitLedger, x.creditLedger, x.amount]),
  [
    ["Payment", "Staff Welfare", "HDFC Bank A/c", 486],
    ["Receipt", "HDFC Bank A/c", "Suspense", 85000],
    ["Contra", "Cash", "HDFC Bank A/c", 10000],
  ],
);
assert.equal(v[0].narration, "UPI-SWIGGY-627512345678"); // reference already in the text: not repeated
assert.equal(tallyVouchers([st], { ...opts, style: "clean" })[1].narration, "Acme salary (NEFT CR-ACME & SONS <SALARY>)");

const xml = toTallyXml([st], opts);
assert.match(xml, /<DATE>20261002<\/DATE>/);
assert.match(xml, /<AMOUNT>-486\.00<\/AMOUNT>/); // debit: negative + ISDEEMEDPOSITIVE Yes
assert.match(xml, /<ISDEEMEDPOSITIVE>Yes<\/ISDEEMEDPOSITIVE>\s*<AMOUNT>-/);
assert.match(xml, /NEFT CR-ACME &amp; SONS &lt;SALARY&gt;/);
assert.ok(!/<SALARY>/.test(xml));
// every voucher balances
for (const m of xml.matchAll(/<VOUCHER [\s\S]*?<\/VOUCHER>/g)) {
  const sum = [...m[0].matchAll(/<AMOUNT>(-?[\d.]+)<\/AMOUNT>/g)].reduce((a, x) => a + Number(x[1]), 0);
  assert.equal(Math.round(sum * 100), 0);
}
assert.deepEqual(tallyLedgersUsed([st], opts), ["Cash", "HDFC Bank A/c", "Staff Welfare", "Suspense"]);
console.log("tally: all tests passed");
