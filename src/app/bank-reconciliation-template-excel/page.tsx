import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";
import { pageMeta } from "@/lib/seo/meta";
import { btn } from "@/lib/ui";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FinalCTA } from "@/components/landing/Sections";
import { Breadcrumbs, Faq, FORMAT_LINKS, GUIDE_LINKS, LinkGrid, Points, Section, SeoHero, Steps } from "@/components/seo/Blocks";

const path = "/bank-reconciliation-template-excel";
const FILE = "/templates/bank-reconciliation-template.xlsx";

export const metadata: Metadata = pageMeta({
  title: "Free Bank Reconciliation Template (Excel) — With Auto-Matching",
  description:
    "Download a free bank reconciliation template for Excel and Google Sheets. Live formulas, a dropdown for each reconciling item, a sheet that flags unmatched transactions, and step-by-step instructions.",
  path,
  absoluteTitle: true,
});

const link = "font-medium text-brand underline-offset-2 hover:underline";

// Worked example: the same figures that ship pre-filled in the template.
const EXAMPLE: [string, string, boolean?][] = [
  ["Ending balance per bank statement", "5,240.18"],
  ["Add: deposits in transit", "1,200.00"],
  ["Less: outstanding checks", "(845.50)"],
  ["Adjusted bank balance", "5,594.68", true],
  ["Ending cash balance per books", "5,620.18"],
  ["Less: bank fees not yet recorded", "(25.50)"],
  ["Adjusted book balance", "5,594.68", true],
  ["Difference", "0.00 ✓", true],
];

export default function Page() {
  return (
    <>
      <Navbar />
      <main>
        <Breadcrumbs items={[["Guides", "/guides"], ["Bank reconciliation template", path]]} />
        <SeoHero
          eyebrow="Free template"
          title="Bank reconciliation template for Excel,"
          accent="that finds the differences for you."
          intro="A free, no-signup Excel workbook for monthly bank reconciliations. Paste your bank and book transactions, see what doesn’t match, and watch the difference go to zero."
        />
        <div className="-mt-4 flex justify-center px-4 pb-6">
          <a href={FILE} download className={btn("primary", "lg")}>
            <Download className="size-4" /> Download the template (.xlsx)
          </a>
        </div>
        <p className="text-center text-xs text-muted">Works in Excel, Google Sheets and LibreOffice. No email required.</p>

        <Section kicker="What’s inside" title="Four sheets, live formulas">
          <Points
            items={[
              ["Reconciliation", "The classic two-sided layout: adjusted bank balance vs adjusted book balance, with a difference cell that turns green at 0.00."],
              ["Adjustments and Match", "List deposits in transit, outstanding checks, fees and errors from a dropdown; they total into the right line. The Match sheet flags every bank row not in your books and vice versa."],
              ["How to use", "Short instructions plus troubleshooting tips, so you can hand the file to a client or a junior bookkeeper."],
            ]}
          />
        </Section>

        <Section kicker="How to do a bank reconciliation" title="Seven steps, once a month">
          <Steps
            steps={[
              "Get the bank side as a spreadsheet: convert the PDF statement, or download your bank’s activity export for the same dates.",
              "Export the cash account from your books (QuickBooks, Xero, Tally or a ledger) for the same period, and paste both into the Match sheet.",
              "Every “Not in books” row is usually a fee, interest or a deposit you haven’t recorded. Every “Not on statement” row is usually a deposit in transit or an outstanding check.",
            ]}
          />
          <ol start={4} className="mt-4 max-w-3xl list-decimal space-y-2 pl-5 leading-relaxed text-ink-soft">
            <li>List each of those items on the Adjustments sheet and pick its type from the dropdown.</li>
            <li>Type the statement’s ending balance and your books’ ending cash balance on the Reconciliation sheet.</li>
            <li>If the difference isn’t 0.00, look for a transposed number (the difference divides by 9) or a flipped sign (the difference is twice an amount).</li>
            <li>Record the bank-only items in your books, then save the reconciliation with that month’s statement.</li>
          </ol>
        </Section>

        <Section kicker="Worked example" title="What a finished reconciliation looks like">
          <div className="max-w-xl overflow-hidden rounded-2xl border border-line-strong bg-card">
            <table className="w-full text-sm">
              <tbody>
                {EXAMPLE.map(([label, value, strong]) => (
                  <tr key={label} className="border-b border-line/70 last:border-0">
                    <td className={`px-5 py-3 ${strong ? "font-semibold text-ink" : "text-ink-soft"}`}>{label}</td>
                    <td className={`num px-5 py-3 text-right ${strong ? "font-semibold text-ink" : "text-ink-soft"}`}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 max-w-3xl text-sm text-muted">These are the example figures pre-filled in the template. Replace them with yours.</p>
        </Section>

        <Section kicker="The slow part" title="Getting the bank side into Excel">
          <div className="max-w-3xl space-y-4 leading-relaxed text-ink-soft">
            <p>
              The reconciliation itself takes minutes. Retyping a PDF statement takes much longer, and one wrong digit means hunting for a difference
              that isn’t really there. Activity exports help for recent months, but older months and client statements usually arrive as PDFs.
            </p>
            <p>
              <Link href="/convert" className={link}>Upload the PDF statement</Link> and download Excel or CSV in about a minute. Before you see it,
              every row is added up and checked against the balances printed on the statement, so the bank side of your reconciliation is right to the
              cent. Works with any bank, including scanned statements. See also{" "}
              <Link href="/bank-statement-to-excel" className={link}>bank statement to Excel</Link> and{" "}
              <Link href="/how-to-read-a-bank-statement" className={link}>how to read a bank statement</Link>.
            </p>
          </div>
        </Section>

        <Faq
          title="Bank reconciliation: FAQ"
          items={[
            ["What is a bank reconciliation?", "A check that the cash balance in your books matches the bank statement once you account for timing differences (deposits in transit, outstanding checks) and items only one side has recorded (bank fees, interest, errors)."],
            ["How often should I reconcile my bank account?", "At least monthly, when each statement arrives. Busy businesses often reconcile weekly so differences are easier to trace."],
            ["Does this template work in Google Sheets?", "Yes. Upload the .xlsx to Google Drive and open it with Google Sheets. The formulas, dropdowns and highlighting carry over."],
            ["Why doesn’t my reconciliation balance?", "Common causes: a missed deposit in transit or outstanding check, a transaction recorded twice, a transposed number (the difference divides evenly by 9), or a debit entered as a credit (the difference is twice that amount)."],
            ["Is the template really free?", "Yes. No signup, no email. Use it for your own business or for clients, and share it freely."],
            ["How do I get my bank statement into Excel?", "Download the activity export from your bank if it covers the period, or convert the PDF statement with BankStatementToSheets. The first pages are free."],
          ]}
        />
        <LinkGrid title="Convert to" links={FORMAT_LINKS} />
        <LinkGrid title="Guides" links={GUIDE_LINKS.filter(([, href]) => href !== path)} />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
