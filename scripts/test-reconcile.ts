// Run: node scripts/test-reconcile.ts
import assert from "node:assert/strict";
import { reconcile } from "../src/lib/extraction/reconcile.ts";
import type { Transaction } from "../src/lib/extraction/schema.ts";

let n = 0;
const t = (date: string, debit: number | null, credit: number | null, balance: number | null): Transaction => ({
  id: String(n++), date, description: "x", reference: null, debit, credit, balance, category: "Other", page: 1, status: "unchecked",
});

// 1. Clean statement
let r = reconcile([t("2026-01-01", 10, null, 90), t("2026-01-02", null, 20, 110)], 100, 110);
assert.equal(r.reconciliation.status, "verified");

// 2. Newest-first statement gets flipped to chronological and verifies
r = reconcile([t("2026-01-02", null, 20, 110), t("2026-01-01", 10, null, 90)], 100, 110);
assert.equal(r.reconciliation.reversedOrder, true);
assert.equal(r.transactions[0].date, "2026-01-01");
assert.equal(r.reconciliation.status, "verified");

// 3. Balance printed only at end of day: grouped rows verify together
r = reconcile([t("2026-01-01", 10, null, null), t("2026-01-01", 5, null, 85), t("2026-01-02", null, 15, 100)], 100, 100);
assert.equal(r.reconciliation.status, "verified");
assert.equal(r.reconciliation.verifiedRows, 3);

// 4. Swapped sign is auto-fixed
r = reconcile([t("2026-01-01", null, 10, 90)], 100, 90);
assert.equal(r.transactions[0].status, "fixed");
assert.equal(r.transactions[0].debit, 10);
assert.equal(r.reconciliation.status, "verified");

// 5. Wrong amount is flagged
r = reconcile([t("2026-01-01", 12, null, 90), t("2026-01-02", null, 20, 110)], 100, 110);
assert.equal(r.reconciliation.status, "mismatch");
assert.equal(r.transactions[0].status, "mismatch");
assert.equal(r.transactions[1].status, "verified");

// 6. No balances at all, totals only
r = reconcile([t("2026-01-01", 10, null, null)], null, null);
assert.equal(r.reconciliation.status, "no_balances");

// 7. No running balances but opening/closing tie out -> verified
r = reconcile([t("2026-01-01", 10, null, null), t("2026-01-03", null, 5, null)], 100, 95);
assert.equal(r.reconciliation.status, "verified");

console.log("reconcile: all 7 tests passed");
