import * as z from "zod/v4";

export const CATEGORIES = [
  "Income",
  "Payroll",
  "Transfer",
  "Groceries",
  "Dining",
  "Shopping",
  "Transport",
  "Travel",
  "Utilities",
  "Rent & Mortgage",
  "Subscriptions",
  "Healthcare",
  "Insurance",
  "Entertainment",
  "Education",
  "Fees & Charges",
  "Interest",
  "Taxes",
  "Cash",
  "Loan Payment",
  "Investment",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

/** Shape Claude must return for one chunk (a range of pages) of a statement. */
export const ModelTransactionSchema = z.object({
  date: z
    .string()
    .describe("Transaction (posting) date in ISO format YYYY-MM-DD."),
  description: z
    .string()
    .describe(
      "Full transaction description/narration exactly as printed, multi-line descriptions joined with a single space.",
    ),
  payee: z
    .string()
    .nullable()
    .describe(
      "Short, clean name of the counterparty or what the row is, in Title Case, 1-5 words, e.g. 'Amazon Pay', 'Paytm wallet top-up', 'ATM withdrawal', 'Bharti Airtel', 'Interest credit', 'NEFT from State Bank of India'. No IDs, card numbers or timestamps. Null only if the narration is meaningless.",
    ),
  reference: z
    .string()
    .nullable()
    .describe(
      "The main transaction identifier: cheque number, or the UPI/IMPS/NEFT/RTGS/card reference or transaction ID — from its own column, or the primary ID inside the narration. Never a card or account number. Else null.",
    ),
  debit: z
    .number()
    .nullable()
    .describe("Money OUT of the account as a positive number, else null."),
  credit: z
    .number()
    .nullable()
    .describe("Money INTO the account as a positive number, else null."),
  balance: z
    .number()
    .nullable()
    .describe(
      "Running balance printed on this row (negative if overdrawn / marked DR), else null. Never compute it yourself.",
    ),
  category: z.enum(CATEGORIES),
  page: z.number().int().describe("1-based page number of the ORIGINAL statement this row appears on."),
});

export const ModelChunkSchema = z.object({
  is_bank_statement: z
    .boolean()
    .describe("False if these pages are clearly not a bank/credit-card statement."),
  bank_name: z.string().nullable(),
  account_holder: z.string().nullable(),
  account_number_last4: z.string().nullable().describe("Last 4 digits of the account number only."),
  account_type: z
    .enum(["checking", "savings", "credit_card", "loan", "other"])
    .nullable(),
  currency: z.string().nullable().describe("ISO 4217 code, e.g. USD, GBP, EUR, INR."),
  statement_period_start: z.string().nullable().describe("YYYY-MM-DD"),
  statement_period_end: z.string().nullable().describe("YYYY-MM-DD"),
  opening_balance: z
    .number()
    .nullable()
    .describe("Opening/previous/brought-forward balance, only if printed on THESE pages."),
  closing_balance: z
    .number()
    .nullable()
    .describe("Closing/new/carried-forward-final balance, only if printed on THESE pages."),
  transactions: z.array(ModelTransactionSchema),
  notes: z
    .string()
    .nullable()
    .describe("Anything the user should know: unreadable rows, ambiguous dates, etc. Null if nothing."),
});

export type ModelChunk = z.infer<typeof ModelChunkSchema>;
export type ModelTransaction = z.infer<typeof ModelTransactionSchema>;

/* ---------- App-level types (shared by server + client) ---------- */

export type RowStatus = "verified" | "fixed" | "mismatch" | "unchecked";

export interface Transaction {
  id: string;
  date: string;
  description: string;
  /** Short clean counterparty name from the model (absent on older conversions). */
  payee?: string | null;
  reference: string | null;
  debit: number | null;
  credit: number | null;
  balance: number | null;
  category: Category;
  page: number;
  status: RowStatus;
  note?: string;
}

/** "asset": balance = money held (bank accounts). "liability": balance = money owed (credit cards, loans). */
export type BalanceDirection = "asset" | "liability";

export type ReconciliationStatus = "verified" | "partial" | "mismatch" | "no_balances";

export interface Reconciliation {
  status: ReconciliationStatus;
  verifiedRows: number;
  fixedRows: number;
  mismatchRows: number;
  uncheckedRows: number;
  totalCredits: number;
  totalDebits: number;
  /** opening ± (credits - debits) - closing (0 when it ties out); the sign follows `direction` */
  difference: number | null;
  reversedOrder: boolean;
  /** Which way rows move the balance; absent on conversions saved before 2026-11-14 (treat as "asset"). */
  direction?: BalanceDirection;
}

export interface Statement {
  id: string;
  fileName: string;
  pages: number;
  bankName: string | null;
  accountHolder: string | null;
  accountLast4: string | null;
  accountType: ModelChunk["account_type"];
  currency: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  openingBalance: number | null;
  closingBalance: number | null;
  transactions: Transaction[];
  reconciliation: Reconciliation;
  notes: string[];
  conversionId?: string | null;
  /** Server-side only (stripped before sending to the browser): how the statement was extracted and what it cost. */
  extraction?: ExtractionMeta;
}

export interface ModelCall {
  model: string;
  pages: string; // e.g. "1-5"
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  ms: number;
}

export interface ExtractionMeta {
  mode: "cascade" | "single";
  fastModel: string | null;
  strongModel: string;
  chunks: number;
  /** chunk indexes re-run on the strong model */
  escalatedChunks: number[];
  escalationReason: string | null;
  /** which pass produced the returned result */
  usedPass: 1 | 2;
  calls: ModelCall[];
  costUsd: number;
  costPerPageUsd: number;
  ms: number;
}

/** NDJSON events streamed from /api/extract */
export type ExtractEvent =
  | { type: "start"; pages: number; chunks: number }
  | { type: "progress"; done: number; total: number }
  | { type: "ping" } // keep-alive through proxies; clients ignore it
  | { type: "result"; statement: Statement; pagesRemaining: number | null }
  | { type: "error"; code: string; message: string };
