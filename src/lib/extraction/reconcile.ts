import type { Reconciliation, Transaction } from "./schema";

const EPS = 0.015;
const close = (a: number, b: number) => Math.abs(a - b) < EPS;
const round2 = (n: number) => Math.round(n * 100) / 100;
const amountOf = (t: Transaction) => (t.credit ?? 0) - (t.debit ?? 0);

/**
 * If a statement lists newest-first, flip it so rows are chronological.
 * Decided by dates first, then by which direction makes running balances tie out.
 */
export function normalizeOrder(txns: Transaction[], opening: number | null): {
  rows: Transaction[];
  reversed: boolean;
} {
  if (txns.length < 2) return { rows: txns, reversed: false };
  const first = txns[0].date;
  const last = txns[txns.length - 1].date;
  if (first > last) return { rows: [...txns].reverse(), reversed: true };
  if (first < last) return { rows: txns, reversed: false };
  // Same-day statement: pick direction with more balance matches.
  const score = (rows: Transaction[]) => {
    let prev = opening;
    let hits = 0;
    for (const t of rows) {
      if (t.balance != null) {
        if (prev != null && close(prev + amountOf(t), t.balance)) hits++;
        prev = t.balance;
      }
    }
    return hits;
  };
  const rev = [...txns].reverse();
  return score(rev) > score(txns) ? { rows: rev, reversed: true } : { rows: txns, reversed: false };
}

/**
 * Walk the statement checking every printed running balance:
 *   previous balance + credits - debits (since then) === printed balance
 * Rows between two known balances are verified as a group.
 * A single-row mismatch that ties out when debit/credit are swapped is auto-fixed.
 *
 * Pure function — runs on the server after extraction and on the client after edits.
 */
export function reconcile(
  input: Transaction[],
  openingBalance: number | null,
  closingBalance: number | null,
  opts: { allowAutoFix?: boolean; reorder?: boolean } = {},
): { transactions: Transaction[]; reconciliation: Reconciliation } {
  const { allowAutoFix = true, reorder = true } = opts;
  const { rows: ordered, reversed } = reorder
    ? normalizeOrder(input, openingBalance)
    : { rows: input, reversed: false };

  // Reset statuses, but keep the note on rows that were auto-fixed in an earlier pass.
  const rows: Transaction[] = ordered.map((t) => ({
    ...t,
    status: "unchecked",
    note: t.status === "fixed" ? t.note : undefined,
  }));

  let anchor: number | null = openingBalance;
  let pending: number[] = [];
  let hasAnyBalance = false;

  const settle = (target: number) => {
    if (anchor == null) {
      // Nothing to compare against yet; these rows define the starting point.
      pending = [];
      return;
    }
    const sum = pending.reduce((s, i) => s + amountOf(rows[i]), 0);
    if (close(anchor + sum, target)) {
      for (const i of pending) rows[i].status = ordered[i].status === "fixed" ? "fixed" : "verified";
    } else if (allowAutoFix && pending.length === 1) {
      const i = pending[0];
      const t = rows[i];
      if ((t.debit != null || t.credit != null) && close(anchor - amountOf(t), target)) {
        rows[i] = {
          ...t,
          debit: t.credit,
          credit: t.debit,
          status: "fixed",
          note: "Debit/credit swapped automatically so the running balance ties out.",
        };
      } else {
        rows[i].status = "mismatch";
        rows[i].note = `Expected balance ${round2(anchor + sum).toFixed(2)}, statement shows ${target.toFixed(2)}.`;
      }
    } else {
      for (const i of pending) rows[i].status = "mismatch";
      const last = pending[pending.length - 1];
      if (last != null)
        rows[last].note = `Rows since last balance should total ${round2(target - anchor).toFixed(2)}, extracted ${round2(sum).toFixed(2)}.`;
    }
    pending = [];
  };

  rows.forEach((t, i) => {
    pending.push(i);
    if (t.balance != null) {
      hasAnyBalance = true;
      settle(t.balance);
      anchor = t.balance;
    }
  });
  if (pending.length && closingBalance != null) settle(closingBalance);

  const totalCredits = round2(rows.reduce((s, t) => s + (t.credit ?? 0), 0));
  const totalDebits = round2(rows.reduce((s, t) => s + (t.debit ?? 0), 0));
  const difference =
    openingBalance != null && closingBalance != null
      ? round2(openingBalance + totalCredits - totalDebits - closingBalance)
      : null;

  const count = (s: Transaction["status"]) => rows.filter((r) => r.status === s).length;
  const fixedRows = count("fixed");
  const mismatchRows = count("mismatch");
  const uncheckedRows = count("unchecked");

  let status: Reconciliation["status"];
  const totalsTie = difference != null && Math.abs(difference) < EPS;
  if (!hasAnyBalance && difference == null) status = "no_balances";
  else if (mismatchRows > 0 || (difference != null && !totalsTie)) status = "mismatch";
  else if (uncheckedRows === 0 || totalsTie) status = "verified";
  else status = "partial";

  // If the statement totals tie out, rows without their own printed balance are covered too.
  if (status === "verified") rows.forEach((r) => r.status === "unchecked" && (r.status = "verified"));

  return {
    transactions: rows,
    reconciliation: {
      status,
      verifiedRows: rows.filter((r) => r.status === "verified").length,
      fixedRows,
      mismatchRows,
      uncheckedRows: rows.filter((r) => r.status === "unchecked").length,
      totalCredits,
      totalDebits,
      difference,
      reversedOrder: reversed,
    },
  };
}
