import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo/meta";
import { FormatPage } from "@/components/seo/FormatPage";

const path = "/bank-statement-to-google-sheets";
export const metadata: Metadata = pageMeta({
  title: "Bank Statement to Google Sheets — Convert PDF Statements in One Click",
  description: "Convert PDF bank statements straight into a formatted Google Sheet. Every transaction checked against the running balance, clean payee names, categories. 20 pages free.",
  path: path,
  absoluteTitle: true,
});

export default function Page() {
  return (
    <FormatPage
      c={{
        path,
        crumb: "Bank statement to Google Sheets",
        eyebrow: "PDF bank statement to Google Sheets",
        title: "Bank statements to Google Sheets,",
        accent: "in one click.",
        intro:
          "Upload a PDF statement and send the verified transactions straight to a new Google Sheet in your Drive — formatted, filtered and ready to share with your accountant or team.",
        whatYouGet: {
          title: "A Google Sheet, not a mess to clean up",
          points: [
            ["Created in your Drive", "One click creates a new spreadsheet with Transactions, Summary and Categories tabs. Real dates and numbers, so SUM, QUERY and pivot tables just work."],
            ["Minimal access", "We use Google’s drive.file permission, so we can only see the sheets we create for you — never the rest of your Drive."],
            ["Or paste anywhere", "Prefer your own template? Copy the table and paste it into any existing sheet; columns line up exactly."],
          ],
        },
        steps: [
          "Upload your PDF bank or credit card statements.",
          "Review the table; verified rows are ticked and anything odd is highlighted.",
          "Click Google Sheets. Connect Google the first time, and the new sheet opens in a new tab.",
        ],
        extra: {
          title: "Why convert to Google Sheets?",
          body: (
            <>
              <p>
                Sheets is where bookkeepers and small teams share numbers. Instead of emailing Excel files back and forth, put each client’s statements in
                one shared sheet, add comments on the transactions that need an explanation, and build a monthly summary with QUERY or a pivot table.
              </p>
              <p>
                Because every row has already been checked against the statement’s running balance, you can trust the totals from the start.
              </p>
            </>
          ),
        },
        faqs: [
          ["Do you get access to my whole Google Drive?", "No. We request Google’s drive.file scope, which only allows access to files our app creates. We can’t see or change anything else in your Drive."],
          ["Can I add statements to an existing Google Sheet?", "Yes. Use Copy table and paste into your sheet — the columns stay aligned. Each one-click export creates a new spreadsheet."],
          ["Does it work with credit card statements?", "Yes. Purchases and fees become debits; payments and refunds become credits."],
          ["Is it free to try?", "Yes. Your first 20 pages are free with no credit card."],
        ],
      }}
    />
  );
}
