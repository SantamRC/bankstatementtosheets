import { CATEGORIES, type Statement, type Transaction } from "@/lib/extraction/schema";

export type Cell = string | number | null;

export interface Table {
  name: string;
  rows: Cell[][];
  moneyCols: number[];
  dateCols: number[];
}

const STATUS_LABEL = { verified: "Verified", fixed: "Auto-fixed", mismatch: "Check", unchecked: "" } as const;

export const signed = (debit: number | null, credit: number | null) =>
  Math.round(((credit ?? 0) - (debit ?? 0)) * 100) / 100;

/** "clean" = short payee name as Description (full narration kept in its own column); "original" = narration as printed. */
export type DescStyle = "clean" | "original";

export const cleanDescription = (t: Pick<Transaction, "payee" | "description">) => t.payee?.trim() || t.description;

/** Rows for the main Transactions sheet. Adds a Source column when several statements are merged. */
export function transactionsTable(statements: Statement[], style: DescStyle = "clean"): Table {
  const multi = statements.length > 1;
  const clean = style === "clean";
  const header = [
    "Date",
    "Description",
    "Reference",
    "Category",
    "Debit",
    "Credit",
    "Amount",
    "Balance",
    "Page",
    "Status",
    ...(clean ? ["Original description"] : []),
    ...(multi ? ["Source"] : []),
  ];
  const rows: Cell[][] = [header];
  for (const s of statements)
    for (const t of s.transactions)
      rows.push([
        t.date,
        clean ? cleanDescription(t) : t.description,
        t.reference,
        t.category,
        t.debit,
        t.credit,
        signed(t.debit, t.credit),
        t.balance,
        t.page,
        STATUS_LABEL[t.status],
        ...(clean ? [t.description] : []),
        ...(multi ? [s.bankName ? `${s.bankName} · ${s.fileName}` : s.fileName] : []),
      ]);
  return { name: "Transactions", rows, moneyCols: [4, 5, 6, 7], dateCols: [0] };
}

export function summaryTable(statements: Statement[]): Table {
  const rows: Cell[][] = [
    [
      "File",
      "Bank",
      "Account",
      "Currency",
      "Period start",
      "Period end",
      "Opening balance",
      "Total credits",
      "Total debits",
      "Closing balance",
      "Transactions",
      "Verification",
    ],
  ];
  for (const s of statements)
    rows.push([
      s.fileName,
      s.bankName,
      s.accountLast4 ? `••••${s.accountLast4}` : null,
      s.currency,
      s.periodStart,
      s.periodEnd,
      s.openingBalance,
      s.reconciliation.totalCredits,
      s.reconciliation.totalDebits,
      s.closingBalance,
      s.transactions.length,
      verificationLabel(s),
    ]);
  return { name: "Summary", rows, moneyCols: [6, 7, 8, 9], dateCols: [4, 5] };
}

export function categoryTable(statements: Statement[]): Table {
  const totals = new Map<string, { out: number; in: number; n: number }>();
  for (const s of statements)
    for (const t of s.transactions) {
      const c = totals.get(t.category) ?? { out: 0, in: 0, n: 0 };
      c.out += t.debit ?? 0;
      c.in += t.credit ?? 0;
      c.n++;
      totals.set(t.category, c);
    }
  const rows: Cell[][] = [["Category", "Transactions", "Money out", "Money in", "Net"]];
  for (const cat of CATEGORIES) {
    const c = totals.get(cat);
    if (c) rows.push([cat, c.n, round(c.out), round(c.in), round(c.in - c.out)]);
  }
  return { name: "Categories", rows, moneyCols: [2, 3, 4], dateCols: [] };
}

export function verificationLabel(s: Statement): string {
  const r = s.reconciliation;
  switch (r.status) {
    case "verified":
      return "Balances verified";
    case "partial":
      return `${r.verifiedRows + r.fixedRows} of ${s.transactions.length} rows verified`;
    case "mismatch":
      return `${r.mismatchRows} row(s) need review`;
    default:
      return "No balances printed to verify";
  }
}

const round = (n: number) => Math.round(n * 100) / 100;

const csvEscape = (v: Cell) => {
  if (v == null) return "";
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const toCSV = (t: Table) => "﻿" + t.rows.map((r) => r.map(csvEscape).join(",")).join("\r\n");

/** Tab-separated text that pastes cleanly into Google Sheets / Excel. */
export const toTSV = (t: Table) =>
  t.rows.map((r) => r.map((v) => (v == null ? "" : String(v).replace(/[\t\n\r]+/g, " "))).join("\t")).join("\n");

export function baseName(statements: Statement[]): string {
  if (statements.length === 1) {
    const s = statements[0];
    const parts = [s.bankName, s.periodStart && s.periodEnd ? `${s.periodStart} to ${s.periodEnd}` : null].filter(Boolean);
    return parts.length ? parts.join(" ") : s.fileName.replace(/\.pdf$/i, "");
  }
  return `Bank statements (${statements.length} files)`;
}
