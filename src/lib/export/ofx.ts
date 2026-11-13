import type { Statement, Transaction } from "../extraction/schema";

/**
 * OFX / QBO export (QuickBooks Online & Desktop .qbo, Xero / Quicken / MoneyWiz / most banks' "OFX" import).
 *
 * OFX 1.02 SGML is used because it is what every importer accepts. A .qbo file is the same document plus Intuit's
 * <INTU.BID> bank code, which QuickBooks requires. One file per account: QuickBooks and Xero import one account at a
 * time, so statements of the same account (same bank + last 4) are merged into one file.
 *
 * Sign convention (OFX): TRNAMT is from the account holder's view, money in positive, money out negative. That holds
 * for credit cards too (charges negative, payments positive), and a card's LEDGERBAL is negative when money is owed.
 *
 * FITIDs are deterministic (hash of account, date, amount, text and occurrence), so re-exporting the same statement
 * gives the same IDs and QuickBooks/Xero skip rows they have already imported.
 *
 * Kept free of "@/" imports and runtime dependencies so scripts/test-ofx.ts can run it with plain node.
 */

export type OfxFlavor = "ofx" | "qbo";

export interface OfxOptions {
  flavor: OfxFlavor;
  /** Payee column: clean payee name (falls back to the bank text) or the bank's original description. */
  style?: "clean" | "original";
  /**
   * Intuit bank code for .qbo. QuickBooks Desktop refuses codes it doesn't know; 3000 is the widely used generic
   * code that both QuickBooks Online and Desktop accept for Web Connect files.
   */
  intuBid?: string;
  /** Server time stamp; injectable for tests. */
  now?: Date;
}

export interface OfxFile {
  filename: string;
  content: string;
  accountLabel: string;
  transactions: number;
}

const CARD_TYPES = new Set(["credit_card"]);

export const ofxAccountKey = (s: Pick<Statement, "bankName" | "accountLast4" | "fileName">) =>
  s.bankName || s.accountLast4 ? `${s.bankName ?? "Bank"}${s.accountLast4 ? ` ${s.accountLast4}` : ""}` : s.fileName;

/** OFX 1.02 is ASCII SGML: drop accents/symbols that importers choke on, escape the 3 SGML specials. */
export function ofxText(v: string, max?: number): string {
  let s = v
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (max && s.length > max) s = s.slice(0, max).trim();
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const ofxDate = (iso: string) => iso.replace(/-/g, "") + "120000";
const stamp = (d: Date) =>
  `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}` +
  `${String(d.getUTCHours()).padStart(2, "0")}${String(d.getUTCMinutes()).padStart(2, "0")}${String(d.getUTCSeconds()).padStart(2, "0")}`;
const round2 = (n: number) => Math.round(n * 100) / 100;

/** 32-bit FNV-1a, hex. Enough to make FITIDs unique within an account and stable across exports. */
function fnv(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

function trnType(t: Transaction, amount: number): string {
  if (t.category === "Fees & Charges" && amount < 0) return "FEE";
  if (t.category === "Interest") return amount < 0 ? "DEBIT" : "INT";
  if (t.category === "Cash" && amount < 0) return "ATM";
  return amount < 0 ? "DEBIT" : "CREDIT";
}

function payeeOf(t: Transaction, style: "clean" | "original") {
  return style === "clean" && t.payee?.trim() ? t.payee.trim() : t.description;
}

function groupByAccount(statements: Statement[]) {
  const groups = new Map<string, Statement[]>();
  for (const s of statements) {
    const k = ofxAccountKey(s);
    groups.set(k, [...(groups.get(k) ?? []), s]);
  }
  return groups;
}

function buildOne(key: string, group: Statement[], o: OfxOptions): OfxFile {
  const style = o.style ?? "original";
  const first = group[0];
  const isCard = group.some((s) => CARD_TYPES.has(s.accountType ?? "") || s.reconciliation?.direction === "liability");
  const currency = (group.find((s) => s.currency)?.currency ?? "USD").toUpperCase().slice(0, 3);
  const acctId = ofxText(first.accountLast4 || "0000", 22);

  const rows: { t: Transaction; amount: number }[] = [];
  for (const s of group)
    for (const t of s.transactions) {
      const amount = round2((t.credit ?? 0) - (t.debit ?? 0));
      if (amount !== 0) rows.push({ t, amount });
    }
  rows.sort((a, b) => (a.t.date < b.t.date ? -1 : a.t.date > b.t.date ? 1 : 0));

  const seen = new Map<string, number>();
  const trns = rows
    .map(({ t, amount }) => {
      const base = `${key}|${t.date}|${amount.toFixed(2)}|${t.description}`;
      const n = (seen.get(base) ?? 0) + 1;
      seen.set(base, n);
      const fitid = `${t.date.replace(/-/g, "")}${fnv(`${base}|${n}`)}`;
      const name = ofxText(payeeOf(t, style), 32) || "Transaction";
      const memo = ofxText(t.reference && !t.description.includes(t.reference) ? `${t.description} Ref ${t.reference}` : t.description, 255);
      const check = amount < 0 && !!t.reference && /^\d{3,10}$/.test(t.reference.trim()) && /\b(cheque|check|chq|chk)\b/i.test(t.description);
      return [
        "<STMTTRN>",
        `<TRNTYPE>${check ? "CHECK" : trnType(t, amount)}`,
        `<DTPOSTED>${ofxDate(t.date)}`,
        `<TRNAMT>${amount.toFixed(2)}`,
        `<FITID>${fitid}`,
        check ? `<CHECKNUM>${ofxText(t.reference!, 12)}` : null,
        `<NAME>${name}`,
        memo && memo !== name ? `<MEMO>${memo}` : null,
        "</STMTTRN>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  const dates = rows.map((r) => r.t.date);
  const starts = group.map((s) => s.periodStart).filter(Boolean) as string[];
  const ends = group.map((s) => s.periodEnd).filter(Boolean) as string[];
  const dtStart = [...starts, ...dates].sort()[0] ?? null;
  const dtEnd = [...ends, ...dates].sort().at(-1) ?? null;

  // Closing balance of the latest statement in the group, in OFX's signed view (owed on a card = negative).
  const latest = [...group].sort((a, b) => ((a.periodEnd ?? "") < (b.periodEnd ?? "") ? -1 : 1)).at(-1)!;
  const closing = latest.closingBalance;
  const ledgerBal =
    closing == null ? null : round2(latest.reconciliation?.direction === "liability" || (isCard && !latest.reconciliation?.direction) ? -closing : closing);

  const now = stamp(o.now ?? new Date());
  const acctType = first.accountType === "savings" ? "SAVINGS" : "CHECKING";
  const tranList = [
    "<BANKTRANLIST>",
    dtStart ? `<DTSTART>${ofxDate(dtStart)}` : null,
    dtEnd ? `<DTEND>${ofxDate(dtEnd)}` : null,
    trns,
    "</BANKTRANLIST>",
    ledgerBal != null ? `<LEDGERBAL>\n<BALAMT>${ledgerBal.toFixed(2)}\n<DTASOF>${ofxDate(latest.periodEnd ?? dtEnd ?? dates.at(-1)!)}\n</LEDGERBAL>` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const body = isCard
    ? `<CREDITCARDMSGSRSV1>
<CCSTMTTRNRS>
<TRNUID>1
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
<CCSTMTRS>
<CURDEF>${currency}
<CCACCTFROM>
<ACCTID>${acctId}
</CCACCTFROM>
${tranList}
</CCSTMTRS>
</CCSTMTTRNRS>
</CREDITCARDMSGSRSV1>`
    : `<BANKMSGSRSV1>
<STMTTRNRS>
<TRNUID>1
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
<STMTRS>
<CURDEF>${currency}
<BANKACCTFROM>
<BANKID>000000000
<ACCTID>${acctId}
<ACCTTYPE>${acctType}
</BANKACCTFROM>
${tranList}
</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>`;

  const bankName = ofxText(first.bankName ?? "Bank", 32);
  const content = `OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE

<OFX>
<SIGNONMSGSRSV1>
<SONRS>
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
<DTSERVER>${now}
<LANGUAGE>ENG
<FI>
<ORG>${bankName}
<FID>${o.flavor === "qbo" ? (o.intuBid ?? "3000") : "0000"}
</FI>${o.flavor === "qbo" ? `\n<INTU.BID>${o.intuBid ?? "3000"}` : ""}
</SONRS>
</SIGNONMSGSRSV1>
${body}
</OFX>
`.replace(/\n/g, "\r\n");

  const period = dtStart && dtEnd ? ` ${dtStart} to ${dtEnd}` : "";
  return {
    filename: `${key}${period}.${o.flavor}`.replace(/[\\/:*?"<>|]+/g, "-"),
    content,
    accountLabel: key,
    transactions: rows.length,
  };
}

/** One OFX/QBO file per account. */
export function toOfxFiles(statements: Statement[], o: OfxOptions): OfxFile[] {
  return [...groupByAccount(statements)].map(([key, group]) => buildOne(key, group, o));
}
