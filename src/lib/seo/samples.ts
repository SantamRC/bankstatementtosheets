import { reconcile } from "@/lib/extraction/reconcile";
import type { Category, Reconciliation, Transaction } from "@/lib/extraction/schema";

/**
 * Fictional sample statements for the SEO landing pages (one per region style).
 * Each bank page renders one of these in that bank's column layout, runs it through the
 * real reconcile() and shows the result. No API calls.
 */
export type Region = "us" | "us_card" | "uk" | "in";

export interface SampleRow {
  date: string; // ISO
  desc: string; // narration as the bank prints it
  payee: string;
  ref?: string;
  type?: string; // UK payment type code (DD, FPO, BGC…)
  out?: number;
  in?: number;
  category: Category;
}

interface Sample {
  currency: string;
  locale: string;
  opening: number;
  rows: SampleRow[];
}

const SAMPLES: Record<Region, Sample> = {
  us: {
    currency: "USD",
    locale: "en-US",
    opening: 2431.06,
    rows: [
      { date: "2026-10-01", desc: "Card Purchase 09/30 Trader Joe's #552 Austin TX Card 4821", payee: "Trader Joe's", out: 64.18, category: "Groceries" },
      { date: "2026-10-02", desc: "Gusto Payroll PPD ID: 9000201", payee: "Gusto payroll", ref: "9000201", in: 3120, category: "Payroll" },
      { date: "2026-10-03", desc: "Zelle Payment To Maria Lopez 18233950", payee: "Zelle to Maria Lopez", ref: "18233950", out: 450, category: "Transfer" },
      { date: "2026-10-06", desc: "Comcast Xfinity Online Pmt 4410293", payee: "Comcast Xfinity", ref: "4410293", out: 89.99, category: "Utilities" },
      { date: "2026-10-09", desc: "ATM Withdrawal 10/09 1200 S Congress Ave Austin TX", payee: "ATM withdrawal", out: 200, category: "Cash" },
      { date: "2026-10-14", desc: "Stripe Transfer ST-K2N8Q1 Harbour Studio", payee: "Stripe payout", ref: "ST-K2N8Q1", in: 1840.5, category: "Income" },
      { date: "2026-10-14", desc: "Card Purchase 10/13 Shell Oil 57442 Austin TX Card 4821", payee: "Shell", out: 48.72, category: "Transport" },
      { date: "2026-10-30", desc: "Monthly Service Fee", payee: "Monthly service fee", out: 12, category: "Fees & Charges" },
    ],
  },
  us_card: {
    currency: "USD",
    locale: "en-US",
    opening: 0,
    rows: [
      { date: "2026-10-02", desc: "PAYMENT RECEIVED - THANK YOU", payee: "Card payment", in: 1250, category: "Transfer" },
      { date: "2026-10-04", desc: "DELTA AIR LINES ATLANTA GA", payee: "Delta Air Lines", out: 428.9, category: "Travel" },
      { date: "2026-10-07", desc: "AMAZON MARKETPLACE NA PA AMZN.COM/BILL WA", payee: "Amazon Marketplace", out: 63.47, category: "Shopping" },
      { date: "2026-10-11", desc: "UBER TRIP HELP.UBER.COM CA", payee: "Uber", out: 18.2, category: "Transport" },
      { date: "2026-10-15", desc: "THE CAPITAL GRILLE NEW YORK NY", payee: "The Capital Grille", out: 182.4, category: "Dining" },
      { date: "2026-10-19", desc: "AMAZON MARKETPLACE REFUND AMZN.COM/BILL WA", payee: "Amazon refund", in: 21.99, category: "Shopping" },
      { date: "2026-10-24", desc: "ADOBE *CREATIVE CLOUD SAN JOSE CA", payee: "Adobe Creative Cloud", out: 59.99, category: "Subscriptions" },
    ],
  },
  uk: {
    currency: "GBP",
    locale: "en-GB",
    opening: 1842.3,
    rows: [
      { date: "2026-10-01", type: "BGC", desc: "ACME DESIGN LTD SALARY", payee: "Acme Design Ltd salary", in: 2650, category: "Payroll" },
      { date: "2026-10-01", type: "DD", desc: "THAMES WATER", payee: "Thames Water", out: 38.5, category: "Utilities" },
      { date: "2026-10-03", type: "DEB", desc: "TESCO STORES 3021 LONDON", payee: "Tesco", out: 54.12, category: "Groceries" },
      { date: "2026-10-03", type: "FPO", desc: "J SMITH RENT OCT 400212 10 03OCT26 09:14", payee: "J Smith (rent)", ref: "400212", out: 1150, category: "Rent & Mortgage" },
      { date: "2026-10-08", type: "DEB", desc: "TFL TRAVEL CH LONDON", payee: "Transport for London", out: 23.4, category: "Transport" },
      { date: "2026-10-15", type: "FPI", desc: "HARBOUR STUDIO INV 2291", payee: "Harbour Studio", ref: "INV 2291", in: 600, category: "Income" },
      { date: "2026-10-21", type: "SO", desc: "SAVINGS POT", payee: "Transfer to savings", out: 200, category: "Transfer" },
      { date: "2026-10-28", type: "DEB", desc: "PRET A MANGER LONDON", payee: "Pret A Manger", out: 7.85, category: "Dining" },
    ],
  },
  in: {
    currency: "INR",
    locale: "en-IN",
    opening: 48210.75,
    rows: [
      { date: "2026-10-01", desc: "NEFT CR-ABCD0001234-ACME TECHNOLOGIES PVT LTD-SALARY OCT 2026", payee: "Acme Technologies salary", ref: "ABCDN26274123456", in: 85000, category: "Payroll" },
      { date: "2026-10-02", desc: "UPI-SWIGGY-SWIGGY.PAY@ABCBANK-ABCD0000001-627512345678-ORDER", payee: "Swiggy", ref: "627512345678", out: 486, category: "Dining" },
      { date: "2026-10-03", desc: "ACH D- TP ACH LICINDIA-1234567890", payee: "LIC premium", ref: "1234567890", out: 5240, category: "Insurance" },
      { date: "2026-10-05", desc: "ATW-512345XXXXXX9876-S1ANMU42-MUMBAI", payee: "ATM withdrawal", out: 10000, category: "Cash" },
      { date: "2026-10-07", desc: "UPI-RAHUL SHARMA-RAHUL.S@OKBANK-ABCD0000002-627998765432-RENT", payee: "Rahul Sharma (rent)", ref: "627998765432", out: 22000, category: "Rent & Mortgage" },
      { date: "2026-10-12", desc: "IMPS-627811112222-HARBOUR DESIGN STUDIO-XXXXXXX4410-INV 88", payee: "Harbour Design Studio", ref: "627811112222", in: 15000, category: "Income" },
      { date: "2026-10-18", desc: "POS 512345XXXXXX9876 RELIANCE SMART MUMBAI", payee: "Reliance Smart", out: 3412.6, category: "Groceries" },
      { date: "2026-10-30", desc: "SMS CHARGES FOR QTR SEP-26 INCL GST", payee: "SMS charges", out: 17.7, category: "Fees & Charges" },
    ],
  },
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export type BalanceMode = "every" | "daily" | "none";

export interface BuiltSample {
  currency: string;
  locale: string;
  rows: (SampleRow & { balance: number | null })[];
  transactions: Transaction[];
  reconciliation: Reconciliation;
  opening: number | null;
  closing: number | null;
}

/** Build a sample with the balances a given bank actually prints, then reconcile it for real. */
export function buildSample(region: Region, mode: BalanceMode): BuiltSample {
  const s = SAMPLES[region];
  const card = region === "us_card";
  let running = s.opening;
  const rows = s.rows.map((r, i, all) => {
    running = round2(running + (r.in ?? 0) - (r.out ?? 0));
    const lastOfDay = all[i + 1]?.date !== r.date;
    const balance = card || mode === "none" || (mode === "daily" && !lastOfDay) ? null : running;
    return { ...r, balance };
  });
  const opening = card ? null : s.opening;
  const closing = card ? null : running;
  const txns: Transaction[] = rows.map((r, i) => ({
    id: `seo-${region}-${i}`,
    date: r.date,
    description: r.desc,
    payee: r.payee,
    reference: r.ref ?? null,
    debit: r.out ?? null,
    credit: r.in ?? null,
    balance: r.balance,
    category: r.category,
    page: 1,
    status: "unchecked",
  }));
  const { transactions, reconciliation } = reconcile(txns, opening, closing, { reorder: false });
  return { currency: s.currency, locale: s.locale, rows, transactions, reconciliation, opening, closing };
}

export const fmtMoney = (n: number | null | undefined, locale: string) =>
  n == null ? "" : n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export type DateFmt = "MM/DD" | "MM/DD/YY" | "DD/MM/YY" | "DD/MM/YYYY" | "DD-MM-YYYY" | "D Mon" | "DD Mon YY" | "D Mon YYYY";

/** Format an ISO date the way a bank prints it (string maths only; no Date objects in prerender). */
export function fmtDate(iso: string, f: DateFmt) {
  const [y, m, d] = iso.split("-");
  const mon = MON[Number(m) - 1];
  switch (f) {
    case "MM/DD": return `${m}/${d}`;
    case "MM/DD/YY": return `${m}/${d}/${y.slice(2)}`;
    case "DD/MM/YY": return `${d}/${m}/${y.slice(2)}`;
    case "DD/MM/YYYY": return `${d}/${m}/${y}`;
    case "DD-MM-YYYY": return `${d}-${m}-${y}`;
    case "D Mon": return `${Number(d)} ${mon}`;
    case "DD Mon YY": return `${d} ${mon} ${y.slice(2)}`;
    case "D Mon YYYY": return `${Number(d)} ${mon} ${y}`;
  }
}

/** Next calendar day for dates that aren't at month end (card "post date"). */
export const nextDay = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${y}-${m}-${String(Number(d) + 1).padStart(2, "0")}`;
};
