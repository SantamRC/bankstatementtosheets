import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo/meta";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FinalCTA } from "@/components/landing/Sections";
import { Breadcrumbs, Faq, FORMAT_LINKS, GUIDE_LINKS, LinkGrid, Points, Section, SeoHero, Steps } from "@/components/seo/Blocks";

const path = "/bank-statements-for-mortgage";

export const metadata: Metadata = pageMeta({
  title: "Bank Statements for a Mortgage — What Lenders Check (and How to Review Fast)",
  description:
    "What mortgage lenders look for in your bank statements: how many months, large deposits, overdrafts and recurring payments. Plus how brokers turn statements into a spreadsheet to review them in minutes.",
  path,
  absoluteTitle: true,
});

export default function Page() {
  return (
    <>
      <Navbar />
      <main>
        <Breadcrumbs items={[["Bank statements for a mortgage", path]]} />
        <SeoHero
          eyebrow="Guide · Mortgages & lending"
          title="Bank statements for a mortgage:"
          accent="what lenders check."
          intro="Lenders read your bank statements to confirm your income, your savings for the deposit and closing costs, and that you have no hidden debts. Here’s what they look for, and how brokers and underwriters review statements in minutes instead of hours."
        />

        <Section kicker="For borrowers" title="How many bank statements do you need?">
          <div className="max-w-3xl space-y-4 leading-relaxed text-ink-soft">
            <p>
              Most lenders ask for your most recent two months of statements for every account you’re using for the deposit or reserves, with every
              page included, even the blank ones. Self-employed borrowers applying for a bank statement loan are often asked for 12 to 24 months, because
              the deposits are used to work out income.
            </p>
            <p>Requirements vary by lender, loan type and country, so always follow your lender’s list.</p>
          </div>
        </Section>

        <Section kicker="Red flags" title="What underwriters look for in your statements">
          <Points
            items={[
              ["Large or unusual deposits", "Deposits that aren’t your regular pay usually need a paper trail, such as a gift letter or the sale of an asset. For conventional US loans, a single deposit over half of your monthly qualifying income is commonly treated as “large”."],
              ["Regular income", "Pay deposits should match the income on your application and payslips, in amount and frequency."],
              ["Overdrafts and returned payments", "NSF fees, bounced payments and frequent overdrafts suggest tight cash flow."],
              ["Recurring payments", "Regular payments to a lender, card or person can reveal debts or obligations that weren’t on the application."],
              ["Enough funds to close", "Your balance needs to cover the deposit, closing costs and any reserves the lender requires, and those funds should be seasoned (in the account for a while)."],
              ["Matching details", "Your name, account number and the statement period must be visible and match the application."],
            ]}
          />
        </Section>

        <Section kicker="For brokers & underwriters" title="Review a borrower’s statements in minutes">
          <Steps
            steps={[
              "Upload the borrower’s PDF statements, digital or scanned. Several months and accounts can go in at once.",
              "We extract every transaction and check it against the statement’s own running balance, so a missing page or row shows up immediately.",
              "Open the Excel file: sort deposits by size, filter by category (Payroll, Transfer, Cash), and use the Summary sheet for total credits and debits per statement.",
            ]}
          />
          <p className="mt-4 max-w-3xl text-sm text-muted">
            Clean payee names make recurring payments easy to spot, and the original bank wording is kept in its own column for your file notes. PDFs
            are never stored.
          </p>
        </Section>

        <Faq
          title="Bank statements for a mortgage: FAQ"
          items={[
            ["Do lenders need every page of the bank statement?", "Usually yes, including blank pages, so they can see the full period. Missing pages often mean the lender asks again."],
            ["Can I give the lender a transaction history instead of a statement?", "Many lenders prefer official statements that show your name, account number and period. A printout of online activity may not be accepted; ask your lender."],
            ["What counts as a large deposit?", "It depends on the lender and loan program. For many conventional US loans, a single deposit over 50% of your monthly qualifying income is treated as large and needs documenting."],
            ["Can a broker convert a borrower’s statements to Excel?", "Yes. Upload the PDFs and download a spreadsheet with every transaction, verified against the statement’s balances, plus totals per statement."],
            ["Does it work with scanned statements?", "Yes. Scanned and photographed statements saved as PDF are read with vision AI."],
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
