import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo/meta";
import { FormatPage } from "@/components/seo/FormatPage";
import { bankBySlug } from "@/lib/seo/banks";
import { FREE_PAGES } from "@/lib/plans";

const path = "/bank-statement-to-tally";

export const metadata: Metadata = pageMeta({
  title: "Bank Statement PDF to Tally — Import Into TallyPrime as Vouchers",
  description: `Convert PDF bank statements to Tally XML: every transaction becomes a Payment, Receipt or Contra voucher with your own ledgers, checked against the statement’s balance first. Works with any Indian bank. ${FREE_PAGES} pages free.`,
  path,
  absoluteTitle: true,
});

const link = "font-medium text-brand underline-offset-2 hover:underline";

const XML_SAMPLE = `<VOUCHER VCHTYPE="Payment" ACTION="Create">
  <DATE>20261007</DATE>
  <NARRATION>UPI-RAHUL SHARMA-...-RENT</NARRATION>
  <ALLLEDGERENTRIES.LIST>
    <LEDGERNAME>Rent</LEDGERNAME>
    <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
    <AMOUNT>-22000.00</AMOUNT>
  </ALLLEDGERENTRIES.LIST>
  <ALLLEDGERENTRIES.LIST>
    <LEDGERNAME>HDFC Bank</LEDGERNAME>
    <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
    <AMOUNT>22000.00</AMOUNT>
  </ALLLEDGERENTRIES.LIST>
</VOUCHER>`;

export default function Page() {
  return (
    <FormatPage
      c={{
        path,
        crumb: "Bank statement to Tally",
        eyebrow: "PDF bank statement to Tally",
        title: "Bank statement PDF to Tally,",
        accent: "without typing a single voucher.",
        intro:
          "Upload any bank statement PDF, check the transactions against the statement’s own balance, and download a Tally XML file: every row becomes a Payment, Receipt or Contra voucher posted to the ledgers you choose.",
        region: "in",
        layout: bankBySlug("hdfc-bank")!.layout,
        whatYouGet: {
          title: "Vouchers Tally can import, posted to your ledgers",
          points: [
            ["The right voucher type", "Money out becomes a Payment voucher, money in a Receipt voucher, and ATM withdrawals or cash deposits a Contra voucher against your Cash ledger."],
            ["Your ledgers, your mapping", "Name the bank ledger as it is in Tally, pick a default ledger (such as Suspense), and optionally map categories like Rent, Salary or Bank charges to ledgers. The mapping is remembered."],
            ["Verified before it reaches your books", "Every row is checked against the running balance on the statement. Rows that don’t tie out are flagged so a wrong amount never becomes a wrong voucher."],
          ],
        },
        steps: [
          "Download the statement PDF from net banking (or unlock the emailed one) and drop it in. Scanned statements work too.",
          "Check the review table: verified rows are ticked, flagged rows are highlighted, and you can edit any cell or category.",
          "Click Tally, confirm the ledger names, download the XML, then in TallyPrime go to Gateway of Tally → Import → Transactions.",
        ],
        extra: {
          title: "Why vouchers, and not TallyPrime’s bank statement import?",
          body: (
            <>
              <p>
                TallyPrime can import bank statements for reconciliation, but only files that come straight from a supported bank. Tally’s help says
                PDFs, and CSV or Excel files converted from PDFs, aren’t accepted. Most statements you receive, especially older months and clients’
                statements, exist only as PDFs.
              </p>
              <p>
                So we turn each transaction into a voucher instead, in Tally’s standard XML import format. The vouchers post to your bank ledger, and
                you can then reconcile that ledger in Tally as usual. A voucher looks like this:
              </p>
              <pre className="overflow-x-auto rounded-xl border border-line-strong bg-card p-4 font-mono text-xs leading-relaxed text-ink">{XML_SAMPLE}</pre>
              <p>
                <strong className="text-ink">Before you import:</strong> every ledger in the file must already exist in your Tally company (the export
                lists them for you), and the dates must fall inside the company’s books. Try the first import on a backup company. Need the statement
                first? See <Link href="/how-to-download-bank-statement" className={link}>how to download a bank statement</Link> and{" "}
                <Link href="/bank-statement-password" className={link}>statement PDF passwords</Link>.
              </p>
              <p className="text-sm text-muted">Tally, TallyPrime and Tally.ERP 9 are trademarks of Tally Solutions. We are not affiliated with Tally Solutions.</p>
            </>
          ),
        },
        faqs: [
          ["How do I import a PDF bank statement into Tally?", "Convert the PDF here, click Tally, set your ledger names and download the XML file. In TallyPrime, go to Gateway of Tally → Import → Transactions and select the file. In older versions, use Import of Data → Vouchers."],
          ["Which Tally versions does it work with?", "The file uses Tally’s standard XML voucher import, which TallyPrime and Tally.ERP 9 both read. Always test the first import on a backup of your company."],
          ["What happens to transactions I can’t identify?", "They go to the default ledger you choose, usually a Suspense ledger. Clear them from Suspense in Tally once you know what they were."],
          ["Can I post salary, rent and bank charges to the right ledgers?", "Yes. Map each category to a Tally ledger once (for example Rent → Rent, Fees & Charges → Bank Charges). The mapping is saved in your browser for next time."],
          ["Does it work with HDFC, SBI, ICICI, Axis and Kotak statements?", "Yes, and with any other bank. There are no per-bank templates: a vision AI model reads the statement, including scanned ones, and long UPI, NEFT and IMPS narrations are kept in the voucher narration."],
          ["Will it create duplicate vouchers if I import twice?", "Yes. Each import creates new vouchers, so import each statement once, or delete the earlier vouchers first."],
          ["How much does it cost?", `The first ${FREE_PAGES} pages are free, with no card. After that, plans start at ₹799 a month for 150 pages, and failed conversions are never charged.`],
        ],
      }}
    />
  );
}
