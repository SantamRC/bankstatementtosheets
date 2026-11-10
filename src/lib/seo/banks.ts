import type { BalanceMode, DateFmt, Region } from "./samples";

/**
 * Bank landing pages (/banks/[slug]). Content must stay accurate and specific — no spun text.
 * Column names describe typical statements and can vary by account type and year; menu paths are
 * hedged because banks redesign their apps. Re-check before adding claims.
 */
export type ColKey = "sno" | "date" | "postDate" | "valueDate" | "desc" | "ref" | "type" | "out" | "in" | "amount" | "balance";

export interface BankLayout {
  cols: { key: ColKey; label: string }[];
  dateFmt: DateFmt;
  balance: BalanceMode;
  /** Date printed only on the first row of each day (common in the UK). */
  dateOnce?: boolean;
  /** Signed single Amount column: "bank" = withdrawals negative, "card" = payments negative. */
  amountSign?: "bank" | "card";
  /** Transactions printed in separate deposit / withdrawal sections. */
  sections?: [string, string];
  balanceSuffix?: string;
}

export interface Bank {
  slug: string;
  name: string;
  /** How people search for it: "<query> to Excel". */
  query: string;
  country: "United States" | "United Kingdom" | "India";
  region: Region;
  accounts: string;
  intro: string;
  layout: BankLayout;
  download: string[];
  quirks: [string, string][];
  faqs: [string, string][];
}

const IN_PASSWORD: [string, string] = [
  "Emailed statements are password-protected",
  "Banks in India usually email statements as locked PDFs. Download the statement from net banking instead, or open the emailed PDF with its password and use Print → Save as PDF to make an unlocked copy, then upload that. Built-in password entry is coming soon.",
];

export const BANKS: Bank[] = [
  /* ---------------- United States ---------------- */
  {
    slug: "chase",
    name: "Chase",
    query: "Chase bank statement",
    country: "United States",
    region: "us",
    accounts: "Chase checking, savings and business statements, plus Chase credit card statements",
    intro:
      "Chase checking statements list every transaction with a single signed Amount column and a running balance, and print dates without the year. We split amounts into Debit and Credit, add the year back, and check every row against the printed balance.",
    layout: {
      cols: [{ key: "date", label: "DATE" }, { key: "desc", label: "DESCRIPTION" }, { key: "amount", label: "AMOUNT" }, { key: "balance", label: "BALANCE" }],
      dateFmt: "MM/DD",
      balance: "every",
      amountSign: "bank",
    },
    download: [
      "Sign in at chase.com or open the Chase Mobile app.",
      "Choose the account, then open Statements & documents (in the account menu).",
      "Pick the month you need and download the PDF. Repeat for each month, or upload several PDFs at once.",
    ],
    quirks: [
      ["One Amount column, negative for money out", "We turn it into separate Debit and Credit columns and a signed Amount column, so totals and pivot tables work straight away."],
      ["Dates are printed as MM/DD with no year", "We take the year from the statement period, including December–January statements that span two years, and give you real Excel dates."],
      ["Card purchases carry a second date inside the description", "The posting date becomes the row date; the purchase date stays in the description so nothing is lost."],
    ],
    faqs: [
      ["Can I just download a CSV from Chase instead?", "Chase lets you download recent account activity as a spreadsheet file, but older months, closed accounts and statements you were sent as PDFs usually only exist as PDF statements. That's where a converter helps — and our output is checked against the statement's own balances."],
      ["Does it work with Chase credit card statements?", "Yes. Sapphire, Freedom, Ink and other Chase card statements work. Purchases and fees become debits; payments and refunds become credits."],
      ["Can I convert a year of Chase statements at once?", "Yes. Drop all twelve PDFs in together. Each is converted and verified separately, and you can export them as one combined spreadsheet with a Source column."],
    ],
  },
  {
    slug: "bank-of-america",
    name: "Bank of America",
    query: "Bank of America statement",
    country: "United States",
    region: "us",
    accounts: "Bank of America checking, savings and Business Advantage statements, plus credit card statements",
    intro:
      "Bank of America statements split transactions into separate sections — deposits, withdrawals, checks and fees — instead of one running list. We merge them back into one chronological sheet and check the totals against the account summary.",
    layout: {
      cols: [{ key: "date", label: "Date" }, { key: "desc", label: "Description" }, { key: "amount", label: "Amount" }],
      dateFmt: "MM/DD/YY",
      balance: "none",
      amountSign: "bank",
      sections: ["Deposits and other additions", "Withdrawals and other subtractions"],
    },
    download: [
      "Sign in to Online Banking or the Bank of America app.",
      "Open the account and go to Statements & Documents.",
      "Choose the statement period and download the PDF.",
    ],
    quirks: [
      ["Deposits and withdrawals are in separate sections", "We read every section and merge it into one list in date order, with the money out in Debit and money in in Credit."],
      ["No running balance next to each row", "Instead we check your extracted totals against the account summary (beginning balance, deposits, withdrawals, ending balance), so a dropped or doubled row is caught."],
      ["Check images and disclosure pages", "Pages with check images or legal text produce no rows, so you get transactions only. Tip: upload just the pages with transactions to use fewer pages."],
    ],
    faqs: [
      ["Why doesn't my Bank of America export show a balance column?", "Bank of America prints daily balances in a separate summary instead of next to each transaction. Your spreadsheet still gets a Balance column wherever one is printed, and the statement is verified against its summary totals."],
      ["Does it handle Bank of America business statements?", "Yes. Business Advantage and other business checking statements use the same section layout and convert the same way."],
      ["Can I import the result into QuickBooks?", "Yes — export CSV and import it in QuickBooks Online under Banking → Upload transactions, mapping Date, Description and Amount. A native QBO file export is on our roadmap."],
    ],
  },
  {
    slug: "wells-fargo",
    name: "Wells Fargo",
    query: "Wells Fargo statement",
    country: "United States",
    region: "us",
    accounts: "Wells Fargo checking, savings and business statements, plus credit card statements",
    intro:
      "Wells Fargo statements print one ending daily balance after the last transaction of each day, not on every row. We verify each day's transactions as a group against that balance, so you still know every row is right.",
    layout: {
      cols: [
        { key: "date", label: "Date" },
        { key: "ref", label: "Check Number" },
        { key: "desc", label: "Description" },
        { key: "in", label: "Deposits/ Additions" },
        { key: "out", label: "Withdrawals/ Subtractions" },
        { key: "balance", label: "Ending daily balance" },
      ],
      dateFmt: "MM/DD",
      balance: "daily",
    },
    download: [
      "Sign in to Wells Fargo Online or the mobile app.",
      "Open Statements & Documents and choose the account.",
      "Select the statement and download or save the PDF.",
    ],
    quirks: [
      ["Ending daily balance only on the last row of each day", "Rows between two printed balances are verified together: the day's deposits minus withdrawals must equal the change in balance, to the cent."],
      ["Deposits come before withdrawals", "Column order trips up copy-paste and template converters and flips signs. We read the column headers, not the position."],
      ["Long descriptions wrap onto two or three lines", "Wrapped lines are joined back into one description, so each transaction stays on one row."],
    ],
    faqs: [
      ["Why are some balance cells empty in my Wells Fargo spreadsheet?", "Because the statement only prints a balance once per day. We keep it exactly as printed rather than computing balances — computed balances would hide extraction errors."],
      ["Does it work with Wells Fargo business statements?", "Yes. Business checking statements follow the same layout and convert the same way."],
      ["What about the check images at the end?", "They're ignored. Check numbers from the transaction table go into the Reference column."],
    ],
  },
  {
    slug: "citi",
    name: "Citi",
    query: "Citibank statement",
    country: "United States",
    region: "us",
    accounts: "Citibank checking and savings statements, plus Citi credit card statements",
    intro:
      "Citi checking statements show amounts subtracted and added in separate columns with a running balance. We map them to Debit and Credit, convert the dates and verify each row against the balance.",
    layout: {
      cols: [
        { key: "date", label: "Date" },
        { key: "desc", label: "Description" },
        { key: "out", label: "Amount Subtracted" },
        { key: "in", label: "Amount Added" },
        { key: "balance", label: "Balance" },
      ],
      dateFmt: "MM/DD",
      balance: "every",
    },
    download: [
      "Sign in at citi.com or open the Citi Mobile app.",
      "Open the account and find Statements (often under the account's menu or Services).",
      "Choose the period and download the PDF.",
    ],
    quirks: [
      ["Relationship statements cover several accounts", "Each account's transactions are extracted in order; the account details are kept so you can split them in the sheet."],
      ["Dates without a year", "The year comes from the statement period, so you get real dates that sort and filter correctly."],
      ["Card statements have no running balance", "For Citi credit cards you get every purchase, payment and refund with the signs kept straight, plus category totals."],
    ],
    faqs: [
      ["Does it work with Citi credit card statements?", "Yes. Citi Double Cash, Custom Cash, Premier and other card statements convert. Purchases are debits; payments and credits are credits."],
      ["My Citi statement covers checking and savings together — is that OK?", "Yes. Upload it as is. All transactions are extracted and you can filter by description or split the sheet afterwards."],
      ["How do I get older Citi statements?", "Citi keeps several years of statements online. For anything older, request copies from Citi and upload the PDFs or scans — scanned statements work too."],
    ],
  },
  {
    slug: "capital-one",
    name: "Capital One",
    query: "Capital One statement",
    country: "United States",
    region: "us_card",
    accounts: "Capital One credit card statements (Quicksilver, Venture, Savor, Spark) and 360 Checking statements",
    intro:
      "Capital One card statements list each transaction with both a transaction date and a post date, and show payments and credits apart from purchases. We give you one clean row per transaction with Debit, Credit and a category.",
    layout: {
      cols: [{ key: "date", label: "Trans Date" }, { key: "postDate", label: "Post Date" }, { key: "desc", label: "Description" }, { key: "amount", label: "Amount" }],
      dateFmt: "MM/DD",
      balance: "none",
      amountSign: "card",
    },
    download: [
      "Sign in at capitalone.com or open the Capital One app.",
      "Select the card or account, then open Statements (View Statements).",
      "Pick the month and download the PDF.",
    ],
    quirks: [
      ["Two dates per transaction", "You get one ISO date per row, so the sheet sorts and filters correctly."],
      ["Transactions grouped by card holder", "Authorised-user transactions are included in the same table, in order."],
      ["Payments and credits listed separately", "They come through as credits, so a refund never looks like a purchase."],
    ],
    faqs: [
      ["Does it work with Capital One 360 Checking statements?", "Yes. Checking and savings statements convert too, and those include balances we verify against."],
      ["Can I use the output for expense reports?", "Yes. Each transaction gets a category (Travel, Dining, Subscriptions…) and the Excel file includes a category summary with live formulas."],
      ["Can I convert Spark business card statements?", "Yes. Business card statements use the same layout."],
    ],
  },
  {
    slug: "american-express",
    name: "American Express",
    query: "Amex statement",
    country: "United States",
    region: "us_card",
    accounts: "American Express personal and business card statements (Platinum, Gold, Blue, Business)",
    intro:
      "Amex statements list charges as positive amounts and payments and credits as negatives, often grouped by card member, with foreign-currency details on extra lines. We turn that into one clean table with charges as debits and payments and refunds as credits.",
    layout: {
      cols: [{ key: "date", label: "Date" }, { key: "desc", label: "Description" }, { key: "amount", label: "Amount" }],
      dateFmt: "MM/DD/YY",
      balance: "none",
      amountSign: "card",
    },
    download: [
      "Sign in at americanexpress.com or open the Amex app.",
      "Go to Statements & Activity, then the Statements tab.",
      "Choose the billing period and download the PDF.",
    ],
    quirks: [
      ["Payments and credits are shown as negative amounts", "They become credits; charges become debits. The signed Amount column follows the same rule, so totals add up."],
      ["Charges grouped by card member", "Supplementary card members' charges are all extracted in date order."],
      ["Foreign-currency lines", "The original amount and exchange rate printed under a charge stay in its description instead of becoming fake rows."],
    ],
    faqs: [
      ["Can I convert Amex business statements for bookkeeping?", "Yes. Business Platinum, Business Gold and other business card statements convert, with categories you can edit before export."],
      ["Why use the PDF instead of the Amex activity download?", "The activity download covers a limited window and doesn't match your official statement. Accountants often need the statement itself — and we convert it as printed."],
      ["Are membership rewards points included?", "No. We extract transactions only; rewards summaries are ignored."],
    ],
  },

  /* ---------------- United Kingdom ---------------- */
  {
    slug: "barclays",
    name: "Barclays",
    query: "Barclays bank statement",
    country: "United Kingdom",
    region: "uk",
    accounts: "Barclays current, savings and business account statements, plus Barclaycard statements",
    intro:
      "Barclays statements use Money out, Money in and Balance columns and print the date once for all the transactions on that day. We carry the date down to every row and check each day against the printed balance.",
    layout: {
      cols: [{ key: "date", label: "Date" }, { key: "desc", label: "Description" }, { key: "out", label: "Money out £" }, { key: "in", label: "Money in £" }, { key: "balance", label: "Balance £" }],
      dateFmt: "D Mon",
      balance: "daily",
      dateOnce: true,
    },
    download: [
      "Log in to the Barclays app or Online Banking.",
      "Select the account and open Statements.",
      "Choose the statement and download it as a PDF.",
    ],
    quirks: [
      ["The date is printed once per day", "Every row gets its own date, so you can sort, filter and pivot without blanks."],
      ["Balance printed at the end of the day's transactions", "Each day's rows are verified together against that balance."],
      ["“Start balance” and “Balance brought forward” lines", "These become the opening balance, not fake transactions."],
    ],
    faqs: [
      ["Does it work with Barclays business statements?", "Yes. Business current account statements convert the same way, and the Excel file is ready for your accountant or Xero import."],
      ["Can I convert Barclaycard statements?", "Yes. Purchases are debits; payments and refunds are credits."],
      ["Can I get the result into Xero?", "Export CSV and use Xero's bank statement import, mapping Date, Description and Amount."],
    ],
  },
  {
    slug: "hsbc",
    name: "HSBC",
    query: "HSBC bank statement",
    country: "United Kingdom",
    region: "uk",
    accounts: "HSBC UK current, savings and business account statements, plus HSBC credit card statements",
    intro:
      "HSBC UK statements put a payment type code (DD, BP, CR, VIS…) in front of the details, print the date once per day and show the balance at the end of each day. We give every row its date, keep the details clean, and verify each day.",
    layout: {
      cols: [{ key: "date", label: "Date" }, { key: "type", label: "Pay type" }, { key: "desc", label: "Payment type and details" }, { key: "out", label: "Paid out" }, { key: "in", label: "Paid in" }, { key: "balance", label: "Balance" }],
      dateFmt: "DD Mon YY",
      balance: "daily",
      dateOnce: true,
    },
    download: [
      "Log on to HSBC UK online banking or the HSBC UK app.",
      "Choose the account and open Statements (or Documents).",
      "Select the statement and download the PDF.",
    ],
    quirks: [
      ["Payment type codes before the details", "The details become a clean payee name; the original text is kept in its own column."],
      ["Date shown only on the first row of each day", "We carry it down so every transaction has a real date."],
      ["Contactless and card payments across several lines", "Wrapped lines are joined so each transaction is one row."],
    ],
    faqs: [
      ["Does it work with HSBC statements outside the UK?", "Yes. HSBC statements from Hong Kong, India, the UAE and elsewhere convert too — there are no per-country templates."],
      ["Can I convert HSBC business statements?", "Yes. Business banking statements convert the same way."],
      ["Do I lose the payment type codes?", "No. Switch to the bank's original descriptions with one toggle, and the full text is always kept in the Original description column."],
    ],
  },
  {
    slug: "lloyds",
    name: "Lloyds",
    query: "Lloyds bank statement",
    country: "United Kingdom",
    region: "uk",
    accounts: "Lloyds Bank current, savings and business account statements, plus Lloyds credit card statements",
    intro:
      "Lloyds statements have a separate Type column (DEB, DD, FPO, BGC…) and put Money In before Money Out — an order that makes copy-paste and template converters flip signs. We read the column headers, not their position, and check every row against the balance.",
    layout: {
      cols: [{ key: "date", label: "Date" }, { key: "desc", label: "Description" }, { key: "type", label: "Type" }, { key: "in", label: "Money In (£)" }, { key: "out", label: "Money Out (£)" }, { key: "balance", label: "Balance (£)" }],
      dateFmt: "DD Mon YY",
      balance: "every",
    },
    download: [
      "Log on to Lloyds Internet Banking or the Lloyds app.",
      "Select the account and open View statements (Statements and correspondence).",
      "Choose the statement and download or save it as a PDF.",
    ],
    quirks: [
      ["Money In comes before Money Out", "We map columns by their headings, so money in is never recorded as money out."],
      ["Type codes in their own column", "Codes like DD (Direct Debit) and FPO (Faster Payment out) help suggest categories; the original text is kept."],
      ["Statements run to many pages", "Long statements are processed in parallel, and the balance check carries across page breaks."],
    ],
    faqs: [
      ["Does this work for Halifax and Bank of Scotland too?", "Yes. Any bank's statement converts — there are no templates — including other Lloyds Banking Group brands."],
      ["Can I convert Lloyds business statements?", "Yes, business account statements convert the same way."],
      ["What if my PDF is a scan of a paper statement?", "Scanned statements work. Very faint or skewed scans may produce a few flagged rows to check before export."],
    ],
  },
  {
    slug: "natwest",
    name: "NatWest",
    query: "NatWest bank statement",
    country: "United Kingdom",
    region: "uk",
    accounts: "NatWest current, savings and business account statements, plus NatWest credit card statements",
    intro:
      "NatWest statements show Paid In before Withdrawn, with a running balance and “brought forward” lines between pages. We map the columns by name, skip the carried-forward lines and verify each row.",
    layout: {
      cols: [{ key: "date", label: "Date" }, { key: "desc", label: "Description" }, { key: "in", label: "Paid In(£)" }, { key: "out", label: "Withdrawn(£)" }, { key: "balance", label: "Balance(£)" }],
      dateFmt: "DD Mon YY",
      balance: "every",
      dateOnce: true,
    },
    download: [
      "Log in to NatWest Online Banking or the NatWest app.",
      "Choose the account and open Statements.",
      "Select the statement period and download the PDF.",
    ],
    quirks: [
      ["Paid In comes before Withdrawn", "Columns are mapped by heading, so signs never flip."],
      ["“Brought forward” lines at the top of each page", "They're used to check continuity across pages, not added as transactions."],
      ["Date printed once per day", "Every row gets its date filled in."],
    ],
    faqs: [
      ["Does it work for RBS and Ulster Bank statements?", "Yes. Any bank works, including other NatWest Group brands."],
      ["Can I convert NatWest business statements?", "Yes, business statements convert the same way."],
      ["Can my mortgage broker use the output?", "Yes. The Excel file has a summary sheet with opening and closing balances and totals, plus category totals for income and outgoings."],
    ],
  },

  /* ---------------- India ---------------- */
  {
    slug: "hdfc-bank",
    name: "HDFC Bank",
    query: "HDFC bank statement",
    country: "India",
    region: "in",
    accounts: "HDFC Bank savings, current and salary account statements, plus HDFC credit card statements",
    intro:
      "HDFC Bank statements use Withdrawal Amt., Deposit Amt. and Closing Balance columns with long UPI and NEFT narrations. We pull out a clean payee name and the UPI/NEFT reference, convert DD/MM/YY dates and check every row against the closing balance.",
    layout: {
      cols: [
        { key: "date", label: "Date" },
        { key: "desc", label: "Narration" },
        { key: "ref", label: "Chq./Ref.No." },
        { key: "valueDate", label: "Value Dt" },
        { key: "out", label: "Withdrawal Amt." },
        { key: "in", label: "Deposit Amt." },
        { key: "balance", label: "Closing Balance" },
      ],
      dateFmt: "DD/MM/YY",
      balance: "every",
    },
    download: [
      "Log in to HDFC Bank NetBanking or the HDFC Bank app.",
      "Open your account and choose Account Statement (or Download historical statement for older periods).",
      "Pick the date range and download the statement as a PDF.",
    ],
    quirks: [
      ["Long UPI narrations", "“UPI-NAME-VPA@BANK-IFSC-REF-NOTE” becomes a clean payee (“Swiggy”) plus the 12-digit UPI reference in its own column. The full narration is kept."],
      ["DD/MM/YY dates", "Converted to real dates, so 04/10/26 is 4 October, never 10 April."],
      IN_PASSWORD,
    ],
    faqs: [
      ["Can I convert an HDFC credit card statement?", "Yes. Card purchases and fees become debits; payments and refunds become credits."],
      ["Does it handle lakh and crore formatting?", "Yes. Amounts like 1,25,000.00 are read correctly and exported as plain numbers."],
      ["Can I use this for ITR or GST working?", "Yes. Categories like Income, Payroll and Taxes are suggested for every row, and the Excel file includes a category summary with formulas your CA can audit."],
    ],
  },
  {
    slug: "icici-bank",
    name: "ICICI Bank",
    query: "ICICI bank statement",
    country: "India",
    region: "in",
    accounts: "ICICI Bank savings and current account statements, plus ICICI credit card statements",
    intro:
      "ICICI Bank statements have both a value date and a transaction date, cheque numbers, Transaction Remarks and separate withdrawal and deposit columns. We keep the right date, extract a clean payee and verify every row against the balance.",
    layout: {
      cols: [
        { key: "sno", label: "S No." },
        { key: "valueDate", label: "Value Date" },
        { key: "date", label: "Transaction Date" },
        { key: "ref", label: "Cheque Number" },
        { key: "desc", label: "Transaction Remarks" },
        { key: "out", label: "Withdrawal Amount (INR)" },
        { key: "in", label: "Deposit Amount (INR)" },
        { key: "balance", label: "Balance (INR)" },
      ],
      dateFmt: "DD/MM/YYYY",
      balance: "every",
    },
    download: [
      "Log in to ICICI Bank Internet Banking or the iMobile app.",
      "Go to your bank account and choose Account Statement.",
      "Select the period and download it as a PDF.",
    ],
    quirks: [
      ["Serial-number column and two dates", "The serial number is dropped and one clean date is kept per row."],
      ["Transaction Remarks with UPI and NEFT codes", "We extract the payee and UPI/IMPS/NEFT reference into separate columns."],
      IN_PASSWORD,
    ],
    faqs: [
      ["Does it work with ICICI credit card statements?", "Yes. Card statements convert with purchases as debits and payments as credits."],
      ["Can I convert several months at once?", "Yes. Upload all the PDFs together and export them as one spreadsheet."],
      ["Does it work with scanned ICICI statements from a branch?", "Yes. Stamped, scanned branch statements are read with vision AI."],
    ],
  },
  {
    slug: "sbi",
    name: "State Bank of India",
    query: "SBI bank statement",
    country: "India",
    region: "in",
    accounts: "SBI savings and current account statements, plus SBI Card statements",
    intro:
      "SBI statements list Txn Date, Value Date, Description, Ref No./Cheque No., Debit, Credit and Balance, with descriptions that often wrap across several lines. We join the lines, pull out the payee and reference, and verify every row.",
    layout: {
      cols: [
        { key: "date", label: "Txn Date" },
        { key: "valueDate", label: "Value Date" },
        { key: "desc", label: "Description" },
        { key: "ref", label: "Ref No./Cheque No." },
        { key: "out", label: "Debit" },
        { key: "in", label: "Credit" },
        { key: "balance", label: "Balance" },
      ],
      dateFmt: "D Mon YYYY",
      balance: "every",
    },
    download: [
      "Log in to OnlineSBI (retail internet banking) or the YONO SBI app.",
      "Open Account Statement under My Accounts.",
      "Choose the date range and download the statement as a PDF.",
    ],
    quirks: [
      ["Descriptions wrap over several lines", "“TO TRANSFER-UPI/DR/…” narrations are joined into one row, with the payee and UPI reference extracted."],
      ["Branch passbook-style statements", "Printed and scanned statements from the branch convert too."],
      IN_PASSWORD,
    ],
    faqs: [
      ["Can I convert an SBI passbook?", "If you scan the passbook pages to a PDF, yes. Clear scans work best."],
      ["Does it work with SBI Card statements?", "Yes. Purchases become debits, payments become credits."],
      ["Can I use it for a loan application?", "Yes. Lenders and brokers use the Summary sheet (opening and closing balances, totals) and the category totals for income and outgoings."],
    ],
  },
  {
    slug: "axis-bank",
    name: "Axis Bank",
    query: "Axis bank statement",
    country: "India",
    region: "in",
    accounts: "Axis Bank savings and current account statements, plus Axis Bank credit card statements",
    intro:
      "Axis Bank statements use Tran Date, Chq No, Particulars, Debit, Credit and Balance columns, plus a branch code. We convert the DD-MM-YYYY dates, extract the payee and reference from Particulars and verify every row.",
    layout: {
      cols: [
        { key: "date", label: "Tran Date" },
        { key: "ref", label: "Chq No" },
        { key: "desc", label: "Particulars" },
        { key: "out", label: "Debit" },
        { key: "in", label: "Credit" },
        { key: "balance", label: "Balance" },
      ],
      dateFmt: "DD-MM-YYYY",
      balance: "every",
    },
    download: [
      "Log in to Axis Bank Internet Banking or the Axis Mobile app.",
      "Open Accounts and choose Statement (Detailed statement).",
      "Select the period and download it as a PDF.",
    ],
    quirks: [
      ["Particulars packed with UPI and IMPS codes", "We extract a clean payee and the transaction reference; the original text is kept."],
      ["Branch code column", "Ignored, so your sheet has only the columns you need."],
      IN_PASSWORD,
    ],
    faqs: [
      ["Does it work with Axis credit card statements?", "Yes. Card statements convert with purchases as debits and payments as credits."],
      ["Can I convert a current account statement for GST reconciliation?", "Yes. Every row gets a category you can edit, and the export has category totals with formulas."],
      ["Is my statement stored?", "No. The PDF is processed in memory and never stored. The extracted table is kept for 30 days so you can re-download it, or until you delete it."],
    ],
  },
  {
    slug: "kotak-mahindra-bank",
    name: "Kotak Mahindra Bank",
    query: "Kotak bank statement",
    country: "India",
    region: "in",
    accounts: "Kotak Mahindra Bank savings (including 811) and current account statements, plus Kotak credit card statements",
    intro:
      "Kotak statements print balances with a Cr or Dr marker and put UPI and IMPS details into one long narration. We read the marker (Dr balances become negative), extract the payee and reference, and verify every row.",
    layout: {
      cols: [
        { key: "date", label: "Date" },
        { key: "desc", label: "Narration" },
        { key: "ref", label: "Chq/Ref No" },
        { key: "out", label: "Withdrawal (Dr)" },
        { key: "in", label: "Deposit (Cr)" },
        { key: "balance", label: "Balance" },
      ],
      dateFmt: "DD-MM-YYYY",
      balance: "every",
      balanceSuffix: "(Cr)",
    },
    download: [
      "Log in to Kotak net banking or the Kotak app.",
      "Go to Statements and choose Account statement.",
      "Select the date range and download the PDF.",
    ],
    quirks: [
      ["Balances marked (Cr) or (Dr)", "Overdrawn (Dr) balances become negative numbers, so the balance check and your formulas work."],
      ["Long UPI narrations", "We pull out a clean payee and the UPI reference into separate columns."],
      IN_PASSWORD,
    ],
    faqs: [
      ["Does it work with Kotak 811 statements?", "Yes. 811 digital account statements convert the same way."],
      ["Can I convert Kotak credit card statements?", "Yes. Purchases are debits, payments are credits."],
      ["Can I export to Google Sheets?", "Yes — create a Google Sheet in one click, or download Excel or CSV."],
    ],
  },
  /* ---------------- Added 2026-11-11 ---------------- */
  {
    slug: "pnc",
    name: "PNC Bank",
    query: "PNC bank statement",
    country: "United States",
    region: "us",
    accounts: "PNC Virtual Wallet, checking, savings and business statements, plus PNC credit card statements",
    intro:
      "PNC statements usually group activity into sections, such as deposits and other additions, and checks and other deductions, with daily balances in a separate table. We merge the sections into one chronological sheet and check the totals against the balance summary.",
    layout: {
      cols: [{ key: "date", label: "Date" }, { key: "desc", label: "Description" }, { key: "amount", label: "Amount" }],
      dateFmt: "MM/DD",
      balance: "none",
      amountSign: "bank",
      sections: ["Deposits and Other Additions", "Checks and Other Deductions"],
    },
    download: [
      "Sign in to PNC Online Banking or the PNC Mobile app.",
      "Choose the account and open Statements (or Documents).",
      "Select the statement period and download the PDF.",
    ],
    quirks: [
      ["Activity split into sections", "Deposits, card purchases, checks and other deductions are read from every section and merged into one list in date order."],
      ["Daily balances printed separately", "Instead of a balance on each row, we check your extracted totals against the statement's beginning and ending balance."],
      ["Virtual Wallet statements cover several accounts", "Spend, Reserve and Growth activity is kept apart, so each account's numbers tie out on their own."],
    ],
    faqs: [
      ["Can I download PNC transactions as a spreadsheet instead?", "PNC lets you export recent activity, but older statements and closed accounts usually exist only as PDFs. Upload those here."],
      ["Does it work with PNC business checking statements?", "Yes. Business statements use the same section layout and convert the same way."],
      ["Can I import the result into QuickBooks?", "Yes. Export CSV and upload it in QuickBooks Online under bank transactions, mapping Date, Description and Amount."],
    ],
  },
  {
    slug: "td-bank",
    name: "TD Bank",
    query: "TD Bank statement",
    country: "United States",
    region: "us",
    accounts: "TD Bank (US) checking, savings and business statements, plus TD credit card statements",
    intro:
      "TD Bank statements typically list daily account activity by type, such as deposits, electronic payments and checks paid, followed by a daily balance summary. We combine every section into one dated list and verify it against the statement's beginning and ending balance.",
    layout: {
      cols: [{ key: "date", label: "POSTING DATE" }, { key: "desc", label: "DESCRIPTION" }, { key: "amount", label: "AMOUNT" }],
      dateFmt: "MM/DD",
      balance: "none",
      amountSign: "bank",
      sections: ["Deposits", "Electronic Payments"],
    },
    download: [
      "Log in to TD Bank online banking or the TD Bank app.",
      "Choose the account and open Statements & Documents (or eStatements).",
      "Pick the month and download the PDF.",
    ],
    quirks: [
      ["Transactions grouped by type", "Deposits, electronic payments, checks and fees are merged back into one chronological sheet."],
      ["Posting dates without the year", "We add the year from the statement period, including statements that run from December into January."],
      ["Check numbers in their own section", "Check numbers move to the Reference column, so you can match them to your books."],
    ],
    faqs: [
      ["Does this work with TD Canada Trust statements?", "Yes. Canadian TD statements convert too; there are no per-bank templates."],
      ["Can I convert TD business statements?", "Yes. Business checking statements convert the same way."],
      ["Can I combine a year of TD statements?", "Yes. Upload all twelve PDFs together and export one spreadsheet with a Source column."],
    ],
  },
  {
    slug: "us-bank",
    name: "U.S. Bank",
    query: "US Bank statement",
    country: "United States",
    region: "us",
    accounts: "U.S. Bank checking, savings and business statements, plus U.S. Bank credit card statements",
    intro:
      "U.S. Bank statements usually separate deposits from withdrawals and print a balance summary rather than a balance on every line. We merge the sections, keep reference numbers in their own column, and check the totals against the summary.",
    layout: {
      cols: [{ key: "date", label: "Date" }, { key: "desc", label: "Description of Transaction" }, { key: "amount", label: "Amount" }],
      dateFmt: "MM/DD",
      balance: "none",
      amountSign: "bank",
      sections: ["Deposits", "Withdrawals"],
    },
    download: [
      "Log in to U.S. Bank online banking or the U.S. Bank Mobile app.",
      "Open the account and choose Statements (under documents).",
      "Select the statement and download the PDF.",
    ],
    quirks: [
      ["Deposits and withdrawals in separate sections", "We read every section and merge it into one list in date order."],
      ["Reference numbers next to transactions", "They move to their own Reference column instead of cluttering the description."],
      ["Balance summary instead of a running balance", "Your extracted totals are checked against the beginning and ending balance, so a dropped row is caught."],
    ],
    faqs: [
      ["Does it work with U.S. Bank business statements?", "Yes. Business checking statements convert the same way."],
      ["Can I convert U.S. Bank credit card statements?", "Yes. Purchases are debits; payments and refunds are credits."],
      ["Can I get the result into Google Sheets?", "Yes. One click creates a formatted Google Sheet, or download Excel or CSV."],
    ],
  },
  {
    slug: "santander-uk",
    name: "Santander UK",
    query: "Santander bank statement",
    country: "United Kingdom",
    region: "uk",
    accounts: "Santander UK current, savings and business account statements, plus Santander credit card statements",
    intro:
      "Santander UK statements typically show Money in, Money out and a Balance on each line, with card payments and Direct Debits described in long text. We turn the text into a clean payee name, give every row a real date and check each line against the balance.",
    layout: {
      cols: [{ key: "date", label: "Date" }, { key: "desc", label: "Description" }, { key: "in", label: "Money in" }, { key: "out", label: "Money out" }, { key: "balance", label: "Balance" }],
      dateFmt: "D Mon",
      balance: "every",
    },
    download: [
      "Log on to Santander Online Banking or the Santander app.",
      "Choose the account and open Statements (or e-Documents).",
      "Select the statement and download the PDF.",
    ],
    quirks: [
      ["Money in comes before Money out", "We read the column headers, so credits never land in the debit column."],
      ["Long card-payment descriptions", "They become a short payee name; the original text is kept in its own column."],
      ["Dates printed without the year", "The year comes from the statement period, so you get real dates."],
    ],
    faqs: [
      ["Can I convert Santander business statements?", "Yes. Business current account statements convert the same way."],
      ["Does it work with Santander statements from Spain or other countries?", "Yes. European number formats (1.234,56) and day-first dates are handled."],
      ["Can I import the result into Xero?", "Yes. Export CSV and use Xero's bank statement import."],
    ],
  },
  {
    slug: "bank-of-baroda",
    name: "Bank of Baroda",
    query: "Bank of Baroda statement",
    country: "India",
    region: "in",
    accounts: "Bank of Baroda savings, current and salary account statements, plus BOBCARD credit card statements",
    intro:
      "Bank of Baroda statements typically have Narration, Cheque No., Withdrawal, Deposit and Balance columns, with long UPI and NEFT narrations. We pull out a clean payee and the UPI reference, read DD-MM-YYYY dates correctly and check every row against the balance.",
    layout: {
      cols: [
        { key: "date", label: "DATE" },
        { key: "desc", label: "NARRATION" },
        { key: "ref", label: "CHQ.NO." },
        { key: "out", label: "WITHDRAWAL(DR)" },
        { key: "in", label: "DEPOSIT(CR)" },
        { key: "balance", label: "BALANCE(INR)" },
      ],
      dateFmt: "DD-MM-YYYY",
      balance: "every",
    },
    download: [
      "Log in to bob World Internet banking or the bob World app.",
      "Open Accounts and choose Account Statement.",
      "Select the date range and download the PDF.",
    ],
    quirks: [
      ["Long UPI and NEFT narrations", "We extract a short payee name and the UPI/IMPS/NEFT reference into separate columns."],
      ["DD-MM-YYYY dates", "Converted to real dates, never confused with month-first formats."],
      IN_PASSWORD,
    ],
    faqs: [
      ["Does it work with Bank of Baroda passbook-style statements from a branch?", "Yes. Printed or stamped statements that were scanned to PDF are read with vision AI."],
      ["Can I use the Excel file for ITR or loan applications?", "Yes. You get a Summary sheet with totals and a Categories sheet your CA can check."],
      ["Does it handle lakh formatting?", "Yes. Amounts like 1,25,000.00 are read correctly and exported as plain numbers."],
    ],
  },
  {
    slug: "punjab-national-bank",
    name: "Punjab National Bank",
    query: "PNB bank statement",
    country: "India",
    region: "in",
    accounts: "Punjab National Bank savings and current account statements, plus PNB credit card statements",
    intro:
      "PNB statements usually list the transaction date, cheque number, withdrawal, deposit and balance, often with the narration in the last column. We read the columns in whatever order they are printed, extract the payee and reference and verify every row.",
    layout: {
      cols: [
        { key: "date", label: "Txn Date" },
        { key: "ref", label: "Cheque No." },
        { key: "out", label: "Withdrawal" },
        { key: "in", label: "Deposit" },
        { key: "balance", label: "Balance" },
        { key: "desc", label: "Narration" },
      ],
      dateFmt: "DD/MM/YYYY",
      balance: "every",
    },
    download: [
      "Log in to PNB ONE or PNB internet banking.",
      "Go to Accounts and choose Account Statement.",
      "Pick the period and download the statement as a PDF.",
    ],
    quirks: [
      ["Narration printed after the amounts", "Column order doesn't matter: descriptions, debits and credits end up in the right columns."],
      ["Balances with Cr or Dr markers", "Overdrawn (Dr) balances become negative numbers so the balance check works."],
      IN_PASSWORD,
    ],
    faqs: [
      ["Does it work with scanned PNB statements?", "Yes. Branch-printed statements scanned to PDF are supported."],
      ["Can I convert several months at once?", "Yes. Upload all the PDFs together and export one spreadsheet."],
      ["Can I export to Google Sheets?", "Yes. One click creates a Google Sheet, or download Excel or CSV."],
    ],
  },
  {
    slug: "canara-bank",
    name: "Canara Bank",
    query: "Canara bank statement",
    country: "India",
    region: "in",
    accounts: "Canara Bank savings and current account statements",
    intro:
      "Canara Bank statements typically show both a transaction date and a value date, a cheque number, a description, and separate debit and credit columns with a running balance. We keep one clean date, extract the payee and UPI reference and verify every row.",
    layout: {
      cols: [
        { key: "date", label: "Txn Date" },
        { key: "valueDate", label: "Value Date" },
        { key: "ref", label: "Cheque No." },
        { key: "desc", label: "Description" },
        { key: "out", label: "Debit" },
        { key: "in", label: "Credit" },
        { key: "balance", label: "Balance" },
      ],
      dateFmt: "DD-MM-YYYY",
      balance: "every",
    },
    download: [
      "Log in to Canara Bank net banking or the Canara ai1 app.",
      "Open your account and choose Account Statement.",
      "Select the period and download it as a PDF.",
    ],
    quirks: [
      ["Two dates per row", "The transaction date becomes the row date; the value date doesn't create duplicate rows."],
      ["UPI and NEFT codes in the description", "A short payee name and the reference are extracted into their own columns."],
      IN_PASSWORD,
    ],
    faqs: [
      ["Does it work with Syndicate Bank statements?", "Yes. Older Syndicate Bank statements (now part of Canara Bank) convert too."],
      ["Can I use this for GST or ITR working?", "Yes. Each row gets a suggested category, and the Excel file has category totals with live formulas."],
      ["Is my statement stored?", "No. PDFs are processed in memory and never stored."],
    ],
  },
  {
    slug: "union-bank-of-india",
    name: "Union Bank of India",
    query: "Union Bank statement",
    country: "India",
    region: "in",
    accounts: "Union Bank of India savings and current account statements (including former Andhra Bank and Corporation Bank accounts)",
    intro:
      "Union Bank of India statements carry a transaction ID, long remarks and withdrawal, deposit and balance columns. We pull a clean payee and reference out of the remarks, convert the dates and check every row against the balance.",
    layout: {
      cols: [
        { key: "date", label: "Date" },
        { key: "ref", label: "Tran Id" },
        { key: "desc", label: "Remarks" },
        { key: "out", label: "Withdrawals" },
        { key: "in", label: "Deposits" },
        { key: "balance", label: "Balance" },
      ],
      dateFmt: "DD/MM/YYYY",
      balance: "every",
    },
    download: [
      "Log in to Union Bank internet banking or the Vyom app.",
      "Go to Accounts and choose Account Statement.",
      "Select the date range and download the PDF.",
    ],
    quirks: [
      ["Transaction IDs on every row", "They move to the Reference column, so descriptions stay readable."],
      ["Long UPI remarks", "We extract the payee and UPI reference into separate columns."],
      IN_PASSWORD,
    ],
    faqs: [
      ["Does it work with old Andhra Bank or Corporation Bank statements?", "Yes. Any layout works, including statements from before the merger."],
      ["Can I convert several accounts at once?", "Yes. Upload all the PDFs together; a Source column shows which statement each row came from."],
      ["Can I export to Google Sheets?", "Yes. One click creates a Google Sheet, or download Excel or CSV."],
    ],
  },
];

export const bankBySlug = (slug: string) => BANKS.find((b) => b.slug === slug);

export const COUNTRIES = ["United States", "United Kingdom", "India"] as const;
