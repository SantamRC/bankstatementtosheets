import type { Statement, Transaction } from "../extraction/schema";

/**
 * QIF export (Quicken for Mac, GnuCash, Banktivity, Moneydance, MoneyWiz, older QuickBooks).
 *
 * Plain text, one record per transaction, "^" ends a record. Bank accounts use !Type:Bank, credit cards !Type:CCard.
 * Amounts are from the account holder's view (money out negative), dates are MM/DD/YYYY, which every QIF reader
 * accepts. One file per account, like the OFX export, because QIF has no account header in single-account files.
 *
 * Kept free of "@/" imports and runtime dependencies so scripts/test-qif.ts can run it with plain node.
 */

export interface QifFile {
  filename: string;
  content: string;
  accountLabel: string;
  transactions: number;
}

const accountKey = (s: Pick<Statement, "bankName" | "accountLast4" | "fileName">) =>
  s.bankName || s.accountLast4 ? `${s.bankName ?? "Bank"}${s.accountLast4 ? ` ${s.accountLast4}` : ""}` : s.fileName;

/** QIF fields are single lines; "^" on its own line would end the record. */
const line = (v: string) => v.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
const qifDate = (iso: string) => `${iso.slice(5, 7)}/${iso.slice(8, 10)}/${iso.slice(0, 4)}`;
const round2 = (n: number) => Math.round(n * 100) / 100;

export function toQifFiles(statements: Statement[], o: { style?: "clean" | "original" } = {}): QifFile[] {
  const style = o.style ?? "original";
  const groups = new Map<string, Statement[]>();
  for (const s of statements) groups.set(accountKey(s), [...(groups.get(accountKey(s)) ?? []), s]);

  return [...groups].map(([key, group]) => {
    const isCard = group.some((s) => s.accountType === "credit_card" || s.reconciliation?.direction === "liability");
    const rows: { t: Transaction; amount: number }[] = [];
    for (const s of group)
      for (const t of s.transactions) {
        const amount = round2((t.credit ?? 0) - (t.debit ?? 0));
        if (amount !== 0) rows.push({ t, amount });
      }
    rows.sort((a, b) => (a.t.date < b.t.date ? -1 : a.t.date > b.t.date ? 1 : 0));

    const records = rows.map(({ t, amount }) => {
      const payee = line(style === "clean" && t.payee?.trim() ? t.payee : t.description);
      const memo = line(t.reference && !t.description.includes(t.reference) ? `${t.description} Ref ${t.reference}` : t.description);
      // N is the cheque number in Quicken; only use it for cheque rows, not invoice or UPI references.
      const num =
        amount < 0 && t.reference && /^\d{1,10}$/.test(t.reference.trim()) && /\b(cheque|check|chq|chk)\b/i.test(t.description)
          ? t.reference.trim()
          : null;
      return [
        `D${qifDate(t.date)}`,
        `T${amount.toFixed(2)}`,
        num ? `N${num}` : null,
        `P${payee || "Transaction"}`,
        memo && memo !== payee ? `M${memo}` : null,
        `L${t.category}`,
        "^",
      ]
        .filter(Boolean)
        .join("\n");
    });

    const dates = rows.map((r) => r.t.date);
    const period = dates.length ? ` ${dates[0]} to ${dates[dates.length - 1]}` : "";
    return {
      filename: `${key}${period}.qif`.replace(/[\\/:*?"<>|]+/g, "-"),
      content: `!Type:${isCard ? "CCard" : "Bank"}\n${records.join("\n")}\n`,
      accountLabel: key,
      transactions: rows.length,
    };
  });
}
