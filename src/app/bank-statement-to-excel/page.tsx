import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo/meta";
import { FormatPage } from "@/components/seo/FormatPage";

const path = "/bank-statement-to-excel";
export const metadata: Metadata = pageMeta({
  title: "Bank Statement to Excel Converter — PDF to XLSX, Verified",
  description: "Convert PDF bank statements to Excel (.xlsx) in seconds. Real dates and numbers, Summary and Categories sheets with live formulas, and every row checked against the running balance. 20 pages free.",
  path: path,
  absoluteTitle: true,
});

export default function Page() {
  return (
    <FormatPage
      c={{
        path,
        crumb: "Bank statement to Excel",
        eyebrow: "PDF bank statement to Excel",
        title: "Convert bank statements to Excel,",
        accent: "verified to the cent.",
        intro:
          "Upload any PDF bank or credit card statement and download a clean Excel workbook: real dates, real numbers, a summary sheet and category totals — with every transaction checked against the statement’s own balances.",
        whatYouGet: {
          title: "A workbook you can use straight away",
          points: [
            ["Transactions sheet", "Date, Description, Reference, Category, Debit, Credit, signed Amount and Balance. Frozen header, filters on, real Excel dates and number formats, negatives in red."],
            ["Summary sheet", "Opening and closing balance, total credits and debits, transaction count and the verification result for each statement."],
            ["Categories sheet with live formulas", "SUMIFS totals per category. Re-categorise a row in the Transactions sheet and the totals update."],
          ],
        },
        steps: [
          "Drop in one or more PDF statements, digital or scanned.",
          "Check the review table. Verified rows are ticked; anything that doesn’t tie out is highlighted, and you can edit any cell.",
          "Click Excel to download the .xlsx file. Several statements can be combined into one workbook.",
        ],
        extra: {
          title: "Why not just copy and paste, or use Acrobat’s PDF to Excel?",
          body: (
            <>
              <p>
                Generic PDF-to-Excel tools copy the page layout, not the data. You get merged cells, descriptions split across rows, dates stored as
                text, amounts with currency symbols that won’t add up, and page headers in the middle of your table.
              </p>
              <p>
                Worse, nothing tells you when a row was dropped or a withdrawal landed in the deposits column. We read the statement as data, then prove
                it: the extracted rows must add up to every printed running balance. If they don’t, you see exactly which rows to check.
              </p>
            </>
          ),
        },
        faqs: [
          ["Is the Excel file compatible with Google Sheets, Numbers and LibreOffice?", "Yes. It’s a standard .xlsx file. Formatting and formulas work in Excel, Google Sheets, Apple Numbers and LibreOffice."],
          ["Can I convert scanned bank statements to Excel?", "Yes. Scanned paper statements and phone photos saved as PDF are read with vision AI. Very low-quality scans may have a few flagged rows to check."],
          ["Can I combine several months into one Excel file?", "Yes. Upload all the statements together and export once — you get one Transactions sheet with a Source column, plus one summary row per statement."],
          ["How much does it cost?", "Your first 20 pages are free with no credit card. After that, plans start at $9/month for 150 pages, and failed conversions are never charged."],
          ["Does it work with any bank?", "Yes. There are no templates, so any bank or card issuer in any country works — from Chase and HSBC to HDFC and small credit unions."],
        ],
      }}
    />
  );
}
