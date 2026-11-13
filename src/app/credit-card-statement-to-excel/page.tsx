import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo/meta";
import { FormatPage } from "@/components/seo/FormatPage";
import { bankBySlug } from "@/lib/seo/banks";

const path = "/credit-card-statement-to-excel";
export const metadata: Metadata = pageMeta({
  title: "Credit Card Statement to Excel Converter — PDF to Excel, CSV & Sheets",
  description: "Convert PDF credit card statements from Amex, Chase, Capital One, Citi and any issuer to Excel, CSV or Google Sheets. Charges and payments split correctly and checked against your new balance. 20 pages free.",
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
          "Card statements mix purchases, payments, refunds, fees and foreign-currency lines — and every issuer prints them differently. We turn them into one clean table with charges as debits, payments and refunds as credits, a category on every row, and a check that it all adds up to your new balance.",
        region: "us_card",
        layout: bankBySlug("american-express")!.layout,
        whatYouGet: {
          title: "Ready for expense reports and bookkeeping",
          points: [
            ["Checked against your new balance", "Previous balance + charges − payments must equal the new balance printed on the statement, to the cent. A missed row or a payment read as a purchase is flagged before you export, and a single flipped sign is fixed automatically."],
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
          ["How do you check a credit card statement is converted correctly?", "A card balance is what you owe, so charges raise it and payments lower it. We add up every extracted row and check that previous balance + charges − payments equals the new balance on the statement. If your card prints a running balance, every row is checked against it too. Anything that doesn’t tie out is highlighted for review."],
          ["Which credit cards are supported?", "Any issuer in any country: American Express, Chase, Capital One, Citi, Discover, Barclaycard, HDFC, ICICI, SBI Card and more. There are no templates."],
          ["Can I combine several cards into one spreadsheet?", "Yes. Upload all the statements together and export once; a Source column shows which card each row came from."],
          ["Can I import card transactions into QuickBooks or Xero?", "Yes. Export CSV and import it as a credit card account, mapping Date, Description and Amount."],
          ["How do I convert a credit card statement PDF to Excel?", "Download the statement PDF from your card issuer’s website or app, upload it here, check the rows and click Excel. CSV and Google Sheets work the same way."],
          ["Can I export my Chase or Amex credit card statement to Excel?", "Yes. Issuers usually let you download recent activity as a spreadsheet, but past statements are often PDF only. Upload those PDFs and get Excel, CSV or Google Sheets."],
          ["Is my statement stored?", "No. PDFs are processed in memory and never stored. The extracted table is kept for 30 days so you can re-download it, or until you delete it."],
        ],
      }}
    />
  );
}
