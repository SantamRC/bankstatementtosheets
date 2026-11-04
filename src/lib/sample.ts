import { reconcile } from "@/lib/extraction/reconcile";
import type { Category, Statement, Transaction } from "@/lib/extraction/schema";

// A fictional statement used for the "Try a sample" demo — no API call, no sign-up.
const rows: [string, string, number | null, number | null, number, Category, number][] = [
  ["2026-03-02", "STRIPE PAYOUT 8823-XK TRANSFER", null, 2480.0, 6690.55, "Income", 1],
  ["2026-03-03", "AWS EMEA AWS.AMAZON.CO INVOICE 7731", 312.18, null, 6378.37, "Subscriptions", 1],
  ["2026-03-05", "PAYROLL ACME LTD REF 0326", null, 3950.0, 10328.37, "Payroll", 1],
  ["2026-03-07", "WHOLE FOODS MKT #1029 AUSTIN TX", 86.4, null, 10241.97, "Groceries", 1],
  ["2026-03-09", "RENT 14 HARBOUR ST STANDING ORDER", 1850.0, null, 8391.97, "Rent & Mortgage", 1],
  ["2026-03-12", "UBER *TRIP 4F2KQ HELP.UBER.COM", 23.75, null, 8368.22, "Transport", 1],
  ["2026-03-14", "NOTION LABS INC SUBSCRIPTION", 16.0, null, 8352.22, "Subscriptions", 2],
  ["2026-03-15", "CITY WATER & POWER AUTOPAY", 142.66, null, 8209.56, "Utilities", 2],
  ["2026-03-18", "TRANSFER FROM SAVINGS ****4410", null, 500.0, 8709.56, "Transfer", 2],
  // The model read this one as a credit; reconciliation swaps it back automatically.
  ["2026-03-19", "DELTA AIR 0062384 ATLANTA", null, 428.9, 8280.66, "Travel", 2],
  ["2026-03-21", "BLUE BOTTLE COFFEE SF", 7.5, null, 8273.16, "Dining", 2],
  ["2026-03-24", "CLIENT PAYMENT INV-1043 BRIGHTLINE CO", null, 1200.0, 9473.16, "Income", 2],
  ["2026-03-27", "MONTHLY ACCOUNT FEE", 12.0, null, 9461.16, "Fees & Charges", 3],
  ["2026-03-31", "INTEREST PAID", null, 3.42, 9464.58, "Interest", 3],
];

const raw: Transaction[] = rows.map(([date, description, debit, credit, balance, category, page], i) => ({
  id: `sample-${i}`,
  date,
  description,
  reference: null,
  debit,
  credit,
  balance,
  category,
  page,
  status: "unchecked",
}));

const { transactions, reconciliation } = reconcile(raw, 4210.55, 9464.58);

export const SAMPLE_STATEMENT: Statement = {
  id: "sample",
  fileName: "sample-northwind-march-2026.pdf",
  pages: 3,
  bankName: "Northwind Bank (sample)",
  accountHolder: "Harbour Studio LLC",
  accountLast4: "2219",
  accountType: "checking",
  currency: "USD",
  periodStart: "2026-03-01",
  periodEnd: "2026-03-31",
  openingBalance: 4210.55,
  closingBalance: 9464.58,
  transactions,
  reconciliation,
  notes: [],
};
