import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo/meta";
import { FormatPage } from "@/components/seo/FormatPage";

const path = "/bank-statement-to-csv";
export const metadata: Metadata = pageMeta({
  title: "Bank Statement to CSV Converter — PDF to CSV for QuickBooks, Xero & More",
  description: "Convert PDF bank statements to clean CSV files with ISO dates, signed amounts and separate debit/credit columns — ready for QuickBooks, Xero, YNAB or your own scripts. Every row verified.",
  path: path,
  absoluteTitle: true,
});

const COLS: [string, string][] = [
  ["Date", "ISO format, YYYY-MM-DD — no day/month confusion"],
  ["Description", "The bank’s narration, or a clean payee name if you switch it on"],
  ["Reference", "Cheque number or UPI/IMPS/NEFT/card reference"],
  ["Category", "Suggested category you can edit before export"],
  ["Debit / Credit", "Money out and money in, both positive"],
  ["Amount", "Signed amount (credit − debit), for tools that want one column"],
  ["Balance", "Running balance exactly as printed"],
  ["Page / Status", "Source page, and whether the row was verified"],
];

export default function Page() {
  return (
    <FormatPage
      c={{
        path,
        crumb: "Bank statement to CSV",
        eyebrow: "PDF bank statement to CSV",
        title: "Convert bank statements to CSV,",
        accent: "clean and verified.",
        intro:
          "Turn PDF statements into CSV files your accounting software actually accepts: one row per transaction, ISO dates, plain numbers and both a signed Amount and separate Debit/Credit columns.",
        whatYouGet: {
          title: "CSV that imports first time",
          points: [
            ["Import-ready columns", "Date, Description, Amount for QuickBooks Online and Xero; Debit and Credit for tools that want two columns. Map what you need and ignore the rest."],
            ["Opens cleanly in Excel", "UTF-8 with a byte-order mark, so £, €, ₹ and accented payee names display correctly when you double-click the file."],
            ["No junk rows", "Page headers, “balance brought forward” lines and totals are left out. Every line is a real transaction."],
          ],
        },
        steps: [
          "Upload one or more PDF statements, digital or scanned.",
          "Review the table: fix or recategorise anything before export.",
          "Click CSV to download. Import it into QuickBooks, Xero, YNAB, Sage or your own scripts.",
        ],
        extra: {
          title: "Columns in the CSV file",
          body: (
            <div className="overflow-hidden rounded-2xl border border-line-strong bg-card">
              <table className="w-full text-left text-sm">
                <tbody>
                  {COLS.map(([k, v]) => (
                    <tr key={k} className="border-b border-line/70 last:border-0">
                      <th className="w-40 px-4 py-3 font-semibold text-ink">{k}</th>
                      <td className="px-4 py-3 text-ink-soft">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ),
        },
        faqs: [
          ["How do I import the CSV into QuickBooks Online?", "In QuickBooks Online go to Banking (or Transactions → Bank transactions), choose Upload transactions / File upload, select the CSV and map Date, Description and Amount. Or skip the mapping: download a .qbo file instead (Accounting → QuickBooks) and upload that."],
          ["How do I import the CSV into Xero?", "Open the bank account in Xero, choose Import a statement, upload the CSV and map Date, Description and Amount (or Debit and Credit)."],
          ["Which date format does the CSV use?", "ISO dates (YYYY-MM-DD), which every accounting tool and spreadsheet reads without guessing whether 04/10 is April or October."],
          ["Can I get one CSV for several statements?", "Yes. Upload them together and export once. A Source column tells you which statement each row came from."],
          ["How do I convert a PDF bank statement to CSV?", "Upload the PDF statement, check the review table, and click CSV. Scanned statements work too, and several statements can be exported into one CSV file."],
          ["Can I import the CSV into Sage, YNAB or other software?", "Yes. Any tool that accepts a bank CSV works: map Date, Description and Amount (or Debit and Credit). Sage, YNAB, FreshBooks, Wave and spreadsheets all accept it."],
          ["Is it free?", "Your first 20 pages are free with no credit card. Paid plans start at $9/month for 150 pages."],
        ],
      }}
    />
  );
}
