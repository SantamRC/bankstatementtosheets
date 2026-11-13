import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo/meta";
import { FormatPage } from "@/components/seo/FormatPage";
import { bankBySlug } from "@/lib/seo/banks";
import { FREE_PAGES } from "@/lib/plans";

const path = "/bank-statement-to-qbo";

export const metadata: Metadata = pageMeta({
  title: "Bank Statement PDF to QBO & OFX — Import Into QuickBooks or Xero",
  description: `Convert PDF bank and credit card statements to QBO for QuickBooks Online and Desktop, or OFX for Xero and Quicken. Every row is checked against the statement's balance first. ${FREE_PAGES} pages free.`,
  path,
  absoluteTitle: true,
});

const link = "font-medium text-brand underline-offset-2 hover:underline";

const QBO_SAMPLE = `<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20261007120000
<TRNAMT>-1850.00
<FITID>2026100752c1a9f0
<NAME>Harbour Properties
<MEMO>RENT 14 HARBOUR ST STANDING ORDER
</STMTTRN>`;

export default function Page() {
  return (
    <FormatPage
      c={{
        path,
        crumb: "Bank statement to QBO",
        eyebrow: "PDF bank statement to QuickBooks",
        title: "Bank statement PDF to QBO and OFX,",
        accent: "checked before it hits your books.",
        intro:
          "Upload a bank or credit card statement PDF, check every transaction against the statement’s own balance, and download a .qbo file for QuickBooks or an .ofx file for Xero, Quicken and Sage.",
        region: "us",
        layout: bankBySlug("chase")!.layout,
        whatYouGet: {
          title: "Files your accounting software imports directly",
          points: [
            ["QBO for QuickBooks", "Web Connect (.qbo) files that QuickBooks Online and QuickBooks Desktop import as bank transactions, with no CSV column mapping."],
            ["OFX for Xero and others", "Standard OFX that Xero, Quicken, Sage, MoneyWiz and most money apps accept. Credit card statements export as card accounts, with charges and payments signed correctly."],
            ["No duplicates on re-import", "Each transaction gets a stable ID, so if you export the same statement twice, QuickBooks and Xero recognise rows they already have and skip them."],
          ],
        },
        steps: [
          "Download the statement PDF from your bank and drop it in. Scanned statements and credit card statements work too.",
          "Check the review table: verified rows are ticked, flagged rows are highlighted, and you can fix any cell before export.",
          "Click Accounting → QuickBooks (.qbo) or OFX (.ofx), then upload the file in QuickBooks under Bank transactions → Upload transactions, or in Xero under Import a statement.",
        ],
        extra: {
          title: "Why convert to QBO instead of CSV?",
          body: (
            <>
              <p>
                QuickBooks and Xero both accept CSV, but you have to map the columns on every import, and date or sign mix-ups are common. A QBO or
                OFX file carries the dates, signed amounts and account type, so the import is one click. Each transaction looks like this:
              </p>
              <pre className="overflow-x-auto rounded-xl border border-line-strong bg-card p-4 font-mono text-xs leading-relaxed text-ink">{QBO_SAMPLE}</pre>
              <p>
                <strong className="text-ink">Why the balance check matters here:</strong> once transactions are in QuickBooks they get categorised and
                reconciled, so a missed row or a payment read as a deposit is expensive to find later. We check every row against the running balance
                printed on the statement before you export, and flag anything that doesn’t tie out. Prefer a spreadsheet? Use{" "}
                <Link href="/bank-statement-to-csv" className={link}>CSV</Link> or <Link href="/bank-statement-to-excel" className={link}>Excel</Link>{" "}
                instead. In India? See <Link href="/bank-statement-to-tally" className={link}>bank statement to Tally</Link>.
              </p>
              <p className="text-sm text-muted">
                QuickBooks is a trademark of Intuit Inc. Xero is a trademark of Xero Limited. We are not affiliated with either company.
              </p>
            </>
          ),
        },
        faqs: [
          ["How do I convert a PDF bank statement to QBO?", "Upload the PDF here, check the rows in the review table, then click Accounting → QuickBooks (.qbo). The file downloads straight away and contains every transaction on the statement."],
          ["How do I import a QBO file into QuickBooks Online?", "Go to Transactions → Bank transactions (or Banking), choose Upload transactions, select the .qbo file and pick the bank account to add it to. The transactions then appear in the For review tab."],
          ["Does it work with QuickBooks Desktop?", "Yes. In QuickBooks Desktop use File → Utilities → Import → Web Connect Files and choose the .qbo file. Test the first import on a backup of your company file."],
          ["Can I import into Xero?", "Yes. Choose OFX (.ofx), then in Xero open the bank account, choose Manage account → Import a statement, and upload the file."],
          ["Do credit card statements work?", "Yes. Card statements export as credit card accounts: purchases and fees are negative, payments and refunds positive, and the balance owed is carried over."],
          ["What if I import the same statement twice?", "Each transaction has a stable ID, so QuickBooks and Xero match rows they already imported instead of creating duplicates."],
          ["How much does it cost?", `The first ${FREE_PAGES} pages are free, with no card. Paid plans start at $9 a month for 150 pages, and failed conversions are never charged.`],
        ],
      }}
    />
  );
}
