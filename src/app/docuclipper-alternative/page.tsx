import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo/meta";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FinalCTA } from "@/components/landing/Sections";
import { Breadcrumbs, Faq, FORMAT_LINKS, GUIDE_LINKS, LinkGrid, Points, Section, SeoHero } from "@/components/seo/Blocks";
import { FREE_PAGES, PLANS } from "@/lib/plans";

const path = "/docuclipper-alternative";
// Competitor facts re-checked on docuclipper.com/pricing on this date. Re-check before editing any number.
const CHECKED = "November 11, 2026";

export const metadata: Metadata = pageMeta({
  title: "DocuClipper Alternative — 10× the Pages for $29, Every Row Verified",
  description:
    "Looking for a DocuClipper alternative? BankStatementToSheets converts PDF bank statements to Excel, CSV and Google Sheets with every row checked against the running balance. Pro: 600 pages for $29/month.",
  path,
  absoluteTitle: true,
});

const plan = (id: string) => PLANS.find((p) => p.id === id)!;

export default function Page() {
  const starter = plan("starter");
  const pro = plan("pro");
  const business = plan("business");
  const rows: [string, string, string][] = [
    ["Entry plan (monthly)", "Starter: $29/month for 60 pages", `Starter: $${starter.price.USD.monthly}/month for ${starter.pages} pages`],
    ["$29 a month buys", "60 pages", `${pro.pages} pages (Pro)`],
    ["Business tier (monthly)", "Business: $159/month for 640 pages", `Business: $${business.price.USD.monthly}/month for ${business.pages.toLocaleString("en-US")} pages`],
    ["Free to try", "14-day trial, up to 120 pages", `${FREE_PAGES} free pages, no time limit, no card`],
    ["Unused pages", "Monthly pages don't roll over", "Monthly pages don't roll over; page packs never expire"],
    ["How numbers are checked", "Against the printed opening and closing balances", "Every row against the printed running balance; a swapped debit/credit is fixed automatically"],
    ["Exports", "Excel, CSV, QBO, IIF, OFX, QFX, QIF; QuickBooks and Xero integrations", "Excel (Transactions, Summary, Categories with formulas), CSV, one-click Google Sheets"],
    ["Uploaded PDFs", "Encrypted in storage; you can delete them", "Never stored: processed in memory only"],
    ["Users", "Unlimited users", "One login per account (team seats planned)"],
    ["Security audit", "SOC 2 Type II", "Not audited yet"],
    ["Currencies", "USD, AUD, CAD, GBP, ZAR", "USD, EUR and INR, tax included"],
  ];

  return (
    <>
      <Navbar />
      <main>
        <Breadcrumbs items={[["DocuClipper alternative", path]]} />
        <SeoHero
          eyebrow="DocuClipper alternative"
          title="The DocuClipper alternative with 10× the pages,"
          accent="every row verified."
          intro={`DocuClipper is a solid tool built for firms. If you mainly need bank and credit card statements turned into Excel, CSV or Google Sheets, BankStatementToSheets gives you ${pro.pages} pages for $${pro.price.USD.monthly} a month, where the same $29 buys 60 pages on DocuClipper’s monthly Starter plan, and it checks every row against the statement’s own balance.`}
        />

        <Section kicker="Side by side" title="BankStatementToSheets vs DocuClipper">
          <div className="overflow-x-auto rounded-2xl border border-line-strong bg-card">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-line bg-paper">
                <tr>
                  <th className="px-5 py-3.5 font-semibold text-muted"> </th>
                  <th className="px-5 py-3.5 font-semibold text-muted">DocuClipper</th>
                  <th className="px-5 py-3.5 font-semibold text-ink">BankStatementToSheets</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(([k, them, us]) => (
                  <tr key={k} className="border-b border-line/70 last:border-0 align-top">
                    <th scope="row" className="px-5 py-3.5 font-medium text-ink">{k}</th>
                    <td className="px-5 py-3.5 text-muted">{them}</td>
                    <td className="px-5 py-3.5 font-medium text-ink">{us}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted">
            DocuClipper details are taken from its public pricing page, checked on {CHECKED}. Prices are monthly billing in USD; both products discount yearly
            billing. Check their site for current terms.
          </p>
        </Section>

        <Section kicker="Why switch" title="Where BankStatementToSheets is better">
          <Points
            items={[
              ["About a tenth of the price per page", `On monthly billing, DocuClipper Starter works out at about $0.48 a page (60 pages for $29). Our Pro plan is about $0.05 a page (${pro.pages} pages for $${pro.price.USD.monthly}).`],
              ["Row-level verification", "A statement can match its opening and closing balance and still have two wrong rows that cancel out. We check every row against the printed running balance, so you see exactly which line to fix."],
              ["Google Sheets in one click", "Get a formatted Google Sheet in your Drive, a multi-sheet Excel workbook with live formulas, or CSV. Edit any row before you export."],
              ["Your PDFs are never stored", "Files are processed in memory and discarded. The extracted table is deleted after 30 days."],
              ["Built for Indian statements too", "Clean payee names and UPI/NEFT references from HDFC, ICICI, SBI and other Indian banks, with plans priced in rupees."],
              ["No trial clock", `The ${FREE_PAGES} free pages don’t expire, and failed conversions are never charged.`],
            ]}
          />
        </Section>

        <Section kicker="Being fair" title="When DocuClipper is the better choice">
          <div className="max-w-3xl space-y-4 leading-relaxed text-ink-soft">
            <p>
              Choose DocuClipper if you need native QuickBooks Desktop or Xero files today (QBO, IIF, OFX, QFX, QIF) or a direct QuickBooks Online and
              Xero sync, if a SOC 2 Type II report is required by your firm’s vendor review, or if you also process invoices, receipts and tax forms.
              It also includes unlimited users and fraud-detection reports on its higher plans.
            </p>
            <p>
              Choose BankStatementToSheets if your work is mostly bank and card statements and you want more pages for the money, row-by-row
              verification, Google Sheets export, or rupee and euro pricing. Native QBO and OFX export is on our roadmap.
            </p>
          </div>
        </Section>

        <Faq
          title="DocuClipper alternative: FAQ"
          items={[
            ["Is BankStatementToSheets cheaper than DocuClipper?", `Yes, per page. On monthly billing $29 buys 60 pages on DocuClipper Starter and ${pro.pages} pages on our Pro plan. Our Business plan is $${business.price.USD.monthly}/month for ${business.pages.toLocaleString("en-US")} pages, against $159/month for 640 pages on DocuClipper Business.`],
            ["Can I try it before I pay?", `Yes. Your first ${FREE_PAGES} pages are free with no credit card and no time limit.`],
            ["Does it work with the same banks?", "Yes. There are no per-bank templates, so any bank or card issuer in any country works, including scanned statements."],
            ["Can I import the results into QuickBooks or Xero?", "Yes, through CSV, which both accept for bank imports. Native QBO/OFX files are planned."],
            ["Is BankStatementToSheets affiliated with DocuClipper?", "No. We’re an independent product. DocuClipper is a trademark of its owner."],
          ]}
        />
        <LinkGrid title="Convert to" links={FORMAT_LINKS} />
        <LinkGrid title="Guides" links={GUIDE_LINKS.filter(([, href]) => href !== path)} />
        <p className="mx-auto max-w-3xl px-4 pb-10 text-center text-xs text-muted sm:px-6">
          DocuClipper is a trademark of its respective owner. BankStatementToSheets is not affiliated with or endorsed by DocuClipper.
        </p>
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
