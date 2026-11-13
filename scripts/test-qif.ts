// Run: node scripts/test-qif.ts
import assert from "node:assert/strict";
import { toQifFiles } from "../src/lib/export/qif.ts";
import type { Statement, Transaction } from "../src/lib/extraction/schema.ts";

const tx = (p: Partial<Transaction>): Transaction => ({
  id: "x", date: "2026-10-02", description: "POS SHELL OIL 5742", payee: "Shell", reference: null,
  debit: null, credit: null, balance: null, category: "Transport", page: 1, status: "verified", ...p,
});
const st = (p: Partial<Statement>): Statement => ({
  id: "s", fileName: "a.pdf", pages: 1, bankName: "Northwind Bank", accountHolder: null, accountLast4: "2219", accountType: "checking",
  currency: "USD", periodStart: null, periodEnd: null, openingBalance: null, closingBalance: null, notes: [],
  reconciliation: { status: "verified", direction: "asset" } as Statement["reconciliation"], transactions: [], ...p,
});

// 1. Bank account: header, US dates, signed amounts, cheque number, category, chronological, zero rows skipped
let [f] = toQifFiles([st({
  transactions: [
    tx({ debit: 48.72 }),
    tx({ date: "2026-10-01", description: "PAYROLL ACME\nOCT", payee: "Acme", credit: 1500, category: "Payroll" }),
    tx({ date: "2026-10-12", description: "CHECK 1043", reference: "1043", debit: 200, category: "Other" }),
    tx({ date: "2026-10-13", description: "AWS INVOICE 7731", reference: "7731", debit: 10, category: "Subscriptions" }),
    tx({ debit: 0 }),
  ],
})]);
assert.ok(f.content.startsWith("!Type:Bank\n"));
assert.equal(f.transactions, 4);
assert.equal((f.content.match(/^\^$/gm) ?? []).length, 4);
assert.ok(!f.content.includes("N7731"), "invoice refs are not cheque numbers");
assert.ok(f.content.includes("D10/01/2026\nT1500.00"));
assert.ok(f.content.includes("T-48.72"));
assert.ok(f.content.includes("N1043"));
assert.ok(f.content.includes("LPayroll"));
assert.ok(f.content.includes("PPAYROLL ACME OCT"), "newlines flattened");
assert.ok(f.content.indexOf("T1500.00") < f.content.indexOf("T-48.72"));
assert.ok(f.filename.endsWith(".qif"));

// 2. Credit card: CCard type, charges negative, payments positive
[f] = toQifFiles([st({ accountType: "credit_card", transactions: [tx({ debit: 428.9 }), tx({ credit: 1250, description: "PAYMENT" })] })], { style: "clean" });
assert.ok(f.content.startsWith("!Type:CCard\n"));
assert.ok(f.content.includes("T-428.90") && f.content.includes("T1250.00"));
assert.ok(f.content.includes("PShell\nMPOS SHELL OIL 5742"), "clean style uses payee, keeps bank text in memo");

// 3. One file per account
assert.equal(toQifFiles([st({ transactions: [tx({ debit: 1 })] }), st({ accountLast4: "9999", transactions: [tx({ debit: 2 })] })]).length, 2);

console.log("qif: all tests passed");
