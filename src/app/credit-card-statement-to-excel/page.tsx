import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo/meta";
import { FormatPage } from "@/components/seo/FormatPage";
import { bankBySlug } from "@/lib/seo/banks";

const path = "/credit-card-statement-to-excel";
export const metadata: Metadata = pageMeta({
  title: "Credit Card Statement to Excel Converter — PDF to Excel, CSV & Sheets",
  description: "Convert PDF credit card statements from Amex, Chase, Capital One, Citi and any issuer to Excel, CSV or Google Sheets. Charges and payments split correctly, with categories. 20 pages free.",
  path: path,
  absoluteTitle: true,
});

export default function Page() {
  return (
    <FormatPage
      c={{
        path,
        crumb: "Credit card statement to Excel",
        eyebrow: "Credit card statement converter",
        title: "Credit card statements to Excel,",
        accent: "with signs kept straight.",
        intro:
          "Card statements mix purchases, payments, refunds, fees and foreign-currency lines — and every issuer prints them differently. We turn them into one clean table with charges as debits, payments and refunds as credits, and a category on every row.",
        region: "us_card",
        layout: bankBySlug("american-express")!.layout,
        whatYouGet: {
          title: "Ready for expense reports and bookkeeping",
          points: [
            ["Charges vs payments, never mixed up", "Purchases and fees are debits; payments, refunds and credits are credits, whatever sign convention your issuer uses."],
            ["Categories on every row", "Travel, Dining, Subscriptions, Shopping and more, editable before export. The Excel file totals them with live formulas."],
            ["Extra lines handled", "Foreign-currency amounts, exchange rates and multi-line merchant names stay in the description instead of becoming fake rows."],
          ],
        },
        steps: [
          "Upload one or more card statements (PDF, digital or scanned).",
          "Review the table and adjust categories if you like.",
          "Export to Excel, CSV or Google Sheets.",
        ],
        faqs: [
          ["Which credit cards are supported?", "Any issuer in any country: American Express, Chase, Capital One, Citi, Discover, Barclaycard, HDFC, ICICI, SBI Card and more. There are no templates."],
          ["Can I combine several cards into one spreadsheet?", "Yes. Upload all the statements together and export once; a Source column shows which card each row came from."],
          ["Can I import card transactions into QuickBooks or Xero?", "Yes. Export CSV and import it as a credit card account, mapping Date, Description and Amount."],
          ["Is my statement stored?", "No. PDFs are processed in memory and never stored. The extracted table is kept for 30 days so you can re-download it, or until you delete it."],
        ],
      }}
    />
  );
}
