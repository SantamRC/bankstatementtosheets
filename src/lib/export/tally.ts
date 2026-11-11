import type { Category, Statement, Transaction } from "../extraction/schema";

/**
 * Tally XML voucher export (TallyPrime and Tally.ERP 9: Import → Transactions / Import of Data → Vouchers).
 *
 * TallyPrime's own bank-statement import (for reconciliation) rejects Excel/CSV made from PDFs, so the route that
 * works is importing every row as a voucher:
 *   money out → Payment  (Dr counter ledger, Cr bank ledger)
 *   money in  → Receipt  (Dr bank ledger,  Cr counter ledger)
 *   either, when the counter ledger is a cash ledger → Contra
 * Tally's sign convention: debit entries have ISDEEMEDPOSITIVE=Yes and a NEGATIVE amount; credits Yes/No and positive.
 * Every ledger named here must already exist in the Tally company, or that voucher fails to import.
 *
 * Kept free of "@/" imports and runtime dependencies so scripts/test-tally.ts can run it with plain node.
 */

export interface TallyOptions {
  /** Tally ledger for each statement's account, keyed by accountKey(statement). */
  bankLedgers: Record<string, string>;
  /** Counter ledger for rows whose category has no mapping. */
  defaultLedger: string;
  /** Optional category → ledger mapping. */
  categoryLedgers?: Partial<Record<Category, string>>;
  /** Ledgers that are cash ledgers (vouchers against them become Contra). */
  cashLedgers?: string[];
  /** Narration: the bank's original description, or the clean payee name with the original in brackets. */
  style?: "clean" | "original";
}

export const accountKey = (s: Pick<Statement, "bankName" | "accountLast4" | "fileName">) =>
  s.bankName || s.accountLast4 ? `${s.bankName ?? "Bank"}${s.accountLast4 ? ` ••${s.accountLast4}` : ""}` : s.fileName;

/** A sensible default Tally ledger name for a statement's account, e.g. "HDFC Bank" or "HDFC Bank 4821". */
export const defaultBankLedger = (s: Pick<Statement, "bankName" | "accountLast4">) => (s.bankName ?? "Bank").trim();

// Tally rejects control characters; & < > " ' must be entities.
export const xmlText = (v: string) =>
  v
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .trim();

const tallyDate = (iso: string) => iso.replace(/-/g, "");
const amt = (n: number) => n.toFixed(2);

function narration(t: Transaction, style: "clean" | "original") {
  const base = style === "clean" && t.payee?.trim() ? `${t.payee.trim()} (${t.description})` : t.description;
  return t.reference && !base.includes(t.reference) ? `${base} Ref ${t.reference}` : base;
}

const entry = (ledger: string, debit: boolean, amount: number) => `
     <ALLLEDGERENTRIES.LIST>
      <LEDGERNAME>${xmlText(ledger)}</LEDGERNAME>
      <ISDEEMEDPOSITIVE>${debit ? "Yes" : "No"}</ISDEEMEDPOSITIVE>
      <AMOUNT>${amt(debit ? -amount : amount)}</AMOUNT>
     </ALLLEDGERENTRIES.LIST>`;

export interface TallyVoucher {
  type: "Payment" | "Receipt" | "Contra";
  date: string;
  amount: number;
  debitLedger: string;
  creditLedger: string;
  narration: string;
}

/** One voucher per transaction with a non-zero amount. */
export function tallyVouchers(statements: Statement[], o: TallyOptions): TallyVoucher[] {
  const cash = new Set((o.cashLedgers ?? []).map((l) => l.trim().toLowerCase()));
  const style = o.style ?? "original";
  const out: TallyVoucher[] = [];
  for (const s of statements) {
    const bank = (o.bankLedgers[accountKey(s)] || defaultBankLedger(s)).trim();
    for (const t of s.transactions) {
      const net = Math.round(((t.credit ?? 0) - (t.debit ?? 0)) * 100) / 100;
      if (net === 0) continue;
      const counter = (o.categoryLedgers?.[t.category] || o.defaultLedger).trim();
      const isCash = cash.has(counter.toLowerCase());
      const inflow = net > 0;
      out.push({
        type: isCash ? "Contra" : inflow ? "Receipt" : "Payment",
        date: t.date,
        amount: Math.abs(net),
        debitLedger: inflow ? bank : counter,
        creditLedger: inflow ? counter : bank,
        narration: narration(t, style),
      });
    }
  }
  return out;
}

export function toTallyXml(statements: Statement[], o: TallyOptions): string {
  const vouchers = tallyVouchers(statements, o)
    .map(
      (v) => `
   <TALLYMESSAGE xmlns:UDF="TallyUDF">
    <VOUCHER VCHTYPE="${v.type}" ACTION="Create" OBJVIEW="Accounting Voucher View">
     <DATE>${tallyDate(v.date)}</DATE>
     <EFFECTIVEDATE>${tallyDate(v.date)}</EFFECTIVEDATE>
     <VOUCHERTYPENAME>${v.type}</VOUCHERTYPENAME>
     <PERSISTEDVIEW>Accounting Voucher View</PERSISTEDVIEW>
     <PARTYLEDGERNAME>${xmlText(v.type === "Receipt" ? v.creditLedger : v.debitLedger)}</PARTYLEDGERNAME>
     <NARRATION>${xmlText(v.narration)}</NARRATION>${entry(v.debitLedger, true, v.amount)}${entry(v.creditLedger, false, v.amount)}
    </VOUCHER>
   </TALLYMESSAGE>`,
    )
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
 <HEADER>
  <TALLYREQUEST>Import Data</TALLYREQUEST>
 </HEADER>
 <BODY>
  <IMPORTDATA>
   <REQUESTDESC>
    <REPORTNAME>Vouchers</REPORTNAME>
   </REQUESTDESC>
   <REQUESTDATA>${vouchers}
   </REQUESTDATA>
  </IMPORTDATA>
 </BODY>
</ENVELOPE>
`;
}

/** Ledger names the file uses, so the user can check they exist in Tally before importing. */
export function tallyLedgersUsed(statements: Statement[], o: TallyOptions): string[] {
  const set = new Set<string>();
  for (const v of tallyVouchers(statements, o)) set.add(v.debitLedger).add(v.creditLedger);
  return [...set].sort((a, b) => a.localeCompare(b));
}
