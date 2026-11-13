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

// 8. Credit card: balance is the amount owed. Purchase 100 raises it, payment 200 lowers it.
const card = () => [t("2026-01-03", 100, null, 600), t("2026-01-10", null, 200, 400)];
r = reconcile(card(), 500, 400, { accountType: "credit_card" });
assert.equal(r.reconciliation.status, "verified");
assert.equal(r.reconciliation.direction, "liability");
assert.equal(r.reconciliation.fixedRows, 0, "must not swap purchases into credits");
assert.equal(r.transactions[0].debit, 100);
assert.equal(r.reconciliation.difference, 0);

// 9. Same card statement with the account type missing: still detected as owed-balance and verified
r = reconcile(card(), 500, 400, { accountType: null });
assert.equal(r.reconciliation.status, "verified");
assert.equal(r.reconciliation.direction, "liability");
assert.equal(r.reconciliation.fixedRows, 0);

// 10. Card with no running balances, only previous and new balance: totals tie the card way
r = reconcile([t("2026-01-03", 100, null, null), t("2026-01-10", null, 200, null)], 500, 400, { accountType: "credit_card" });
assert.equal(r.reconciliation.status, "verified");
assert.equal(r.reconciliation.difference, 0);

// 11. Card that prints the amount owed as a negative number: bank direction ties out, so it wins
r = reconcile([t("2026-01-03", 100, null, -600), t("2026-01-10", null, 200, -400)], -500, -400, { accountType: "credit_card" });
assert.equal(r.reconciliation.status, "verified");
assert.equal(r.reconciliation.direction, "asset");
assert.equal(r.reconciliation.fixedRows, 0);

// 12. A bank account mislabelled as a card still verifies the bank way
r = reconcile([t("2026-01-01", 10, null, 90), t("2026-01-02", null, 20, 110)], 100, 110, { accountType: "credit_card" });
assert.equal(r.reconciliation.status, "verified");
assert.equal(r.reconciliation.direction, "asset");

// 13. Card swapped sign is still auto-fixed (payment read as a purchase)
r = reconcile([t("2026-01-03", 100, null, 600), t("2026-01-10", 200, null, 400), t("2026-01-12", 50, null, 450)], 500, 450, { accountType: "credit_card" });
assert.equal(r.reconciliation.direction, "liability");
assert.equal(r.transactions[1].status, "fixed");
assert.equal(r.transactions[1].credit, 200);
assert.equal(r.reconciliation.status, "verified");

// 14. Re-check after an edit keeps the card direction and flags a wrong amount
r = reconcile([t("2026-01-03", 120, null, 600), t("2026-01-10", null, 200, 400)], 500, 400, { direction: "liability", reorder: false, allowAutoFix: false });
assert.equal(r.reconciliation.status, "mismatch");
assert.equal(r.transactions[0].status, "mismatch");
assert.equal(r.transactions[1].status, "verified");

console.log("reconcile: all 14 tests passed");
