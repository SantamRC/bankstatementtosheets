import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo/meta";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FinalCTA } from "@/components/landing/Sections";
import { StatementPreview } from "@/components/seo/StatementPreview";
import { Breadcrumbs, Faq, FORMAT_LINKS, GUIDE_LINKS, LinkGrid, Section, SeoHero } from "@/components/seo/Blocks";
import type { BankLayout } from "@/lib/seo/banks";

const path = "/how-to-read-a-bank-statement";

export const metadata: Metadata = pageMeta({
  title: "How to Read a Bank Statement — Sections, Columns & Abbreviations",
  description:
    "How to read a bank statement: what each section and column means, how the running balance works, what codes like ACH, POS, DD, BGC, NEFT and UPI mean, and how to check a statement for errors.",
  path,
  absoluteTitle: true,
});

const LAYOUT: BankLayout = {
  cols: [{ key: "date", label: "Date" }, { key: "desc", label: "Description" }, { key: "out", label: "Withdrawals" }, { key: "in", label: "Deposits" }, { key: "balance", label: "Balance" }],
  dateFmt: "MM/DD",
  balance: "every",
};

const PARTS: [string, string][] = [
  ["Header", "Your name and address, the account type and number (usually partly masked), and the statement period, for example Oct 1 – Oct 31. Lenders check that the name and period match your application."],
  ["Account summary", "Opening (beginning) balance, total deposits and credits, total withdrawals and debits, and closing (ending) balance. Opening + deposits − withdrawals should equal the closing balance."],
  ["Transactions", "One line per transaction, in date order: the date, a description of who paid or was paid, the amount (either one signed Amount column or separate Withdrawals and Deposits columns), and often a running balance."],
  ["Fees and interest", "Monthly service fees, overdraft or returned-item fees, and interest paid. Some banks list them in the transactions, others in a separate box with year-to-date totals."],
  ["Checks and cheques", "Many US statements list paid checks separately by check number. In the UK and India, cheques appear in the transactions with the cheque number in a reference column."],
  ["Messages and disclosures", "Rate changes, fee schedule updates and the bank’s contact details for disputes. Worth skimming: fee changes are announced here."],
];

const CODES: [string, [string, string][]][] = [
  [
    "United States",
    [
      ["ACH", "Automated Clearing House: electronic bank-to-bank payments such as payroll, bill pay and transfers"],
      ["PPD / CCD", "ACH entry types: PPD is a consumer payment (payroll, direct debit), CCD a business-to-business payment"],
      ["POS", "Point of sale: a debit card purchase in a store"],
      ["ATM", "Cash withdrawal or deposit at an ATM"],
      ["Zelle / P2P", "Person-to-person transfer"],
      ["NSF", "Non-sufficient funds: a payment returned, usually with a fee"],
    ],
  ],
  [
    "United Kingdom",
    [
      ["BGC / BACS", "Bank giro credit or BACS payment: often salary or a refund"],
      ["DD", "Direct Debit, collected by the company you pay"],
      ["SO", "Standing order you set up"],
      ["FPI / FPO", "Faster Payment in / out"],
      ["DEB / POS", "Debit card payment"],
      ["CHQ / TFR", "Cheque, and transfer between accounts"],
    ],
  ],
  [
    "India",
    [
      ["UPI", "Unified Payments Interface: instant payment; the narration carries the UPI ID and a 12-digit reference"],
      ["NEFT / RTGS / IMPS", "Bank transfers: batch (NEFT), high-value real-time (RTGS) and instant (IMPS)"],
      ["ACH / NACH", "Auto-debit mandates such as EMIs, SIPs and insurance premiums"],
      ["ATW / NWD", "ATM withdrawal (own bank / other bank)"],
      ["POS", "Debit card purchase"],
      ["MMT / INF / CHQ", "Mobile money transfer (IMPS), internet fund transfer, cheque"],
    ],
  ],
];

const link = "font-medium text-brand underline-offset-2 hover:underline";

export default function Page() {
  return (
    <>
      <Navbar />
      <main>
        <Breadcrumbs items={[["Guides", "/guides"], ["How to read a bank statement", path]]} />
        <SeoHero
          eyebrow="Guide"
          title="How to read a bank statement,"
          accent="line by line."
          intro="What every section and column means, what the codes in the descriptions stand for, and a two-minute check that tells you whether the statement adds up."
        />

        <Section kicker="The parts" title="What’s on a bank statement">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {PARTS.map(([title, body], i) => (
              <div key={title} className="rounded-2xl border border-line-strong bg-card p-5">
                <span className="num grid size-8 place-items-center rounded-full bg-ink text-sm font-semibold text-paper">{i + 1}</span>
                <h3 className="mt-3 font-semibold">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{body}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section kicker="The columns" title="Debits, credits and the running balance">
          <div className="max-w-3xl space-y-4 leading-relaxed text-ink-soft">
            <p>
              <strong className="text-ink">Debits</strong> (withdrawals, money out) reduce your balance. <strong className="text-ink">Credits</strong>{" "}
              (deposits, money in) increase it. Some banks print one Amount column with a minus sign for money out; others print two columns, or mark
              amounts with Dr and Cr.
            </p>
            <p>
              The <strong className="text-ink">running balance</strong> is what was in the account after each transaction. Every line follows the same
              rule: previous balance + credit − debit = new balance. Some banks print it on every line, others once per day, and credit card statements
              don’t print one at all.
            </p>
            <p>
              Credit cards are the mirror image: a purchase is a debit that increases what you owe, and a payment is a credit that reduces it.
            </p>
          </div>
        </Section>

        <section className="mx-auto max-w-6xl px-4 sm:px-6">
          <StatementPreview region="us" layout={LAYOUT} bankName="bank" />
          <p className="mt-3 text-center text-xs text-muted">
            Left: a fictional statement. Right: the same transactions in a spreadsheet, each checked against the running balance.
          </p>
        </section>

        <Section kicker="The codes" title="What the abbreviations in descriptions mean">
          <div className="grid gap-6 lg:grid-cols-3">
            {CODES.map(([country, rows]) => (
              <div key={country} className="overflow-hidden rounded-2xl border border-line-strong bg-card">
                <h3 className="border-b border-line bg-paper px-5 py-3 font-semibold">{country}</h3>
                <dl className="divide-y divide-line/70 text-sm">
                  {rows.map(([code, meaning]) => (
                    <div key={code} className="grid grid-cols-[92px_1fr] gap-3 px-5 py-3">
                      <dt className="font-mono font-semibold text-ink">{code}</dt>
                      <dd className="text-ink-soft">{meaning}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm text-muted">Codes vary between banks. If one isn’t listed, your bank’s website or app usually has a glossary.</p>
        </Section>

        <Section kicker="Check it" title="How to check a bank statement for errors">
          <ol className="max-w-3xl list-decimal space-y-3 pl-5 leading-relaxed text-ink-soft">
            <li>Check the summary: opening balance + total credits − total debits should equal the closing balance.</li>
            <li>Check that the opening balance equals last month’s closing balance, so no period is missing.</li>
            <li>Scan for transactions you don’t recognise, duplicate charges, and fees you weren’t expecting.</li>
            <li>Match the statement against your own records: receipts, invoices or your accounting software. That’s a bank reconciliation; our <Link href="/bank-reconciliation-template-excel" className={link}>free Excel template</Link> does the arithmetic.</li>
            <li>Report anything wrong to your bank quickly. Dispute windows are limited (often around 60 days for US consumer accounts).</li>
          </ol>
          <p className="mt-6 max-w-3xl leading-relaxed text-ink-soft">
            Doing this by hand for a long statement is slow. When you{" "}
            <Link href="/convert" className={link}>convert a statement with BankStatementToSheets</Link>, the running-balance check is done for every
            row automatically, and anything that doesn’t add up is highlighted for you.
          </p>
        </Section>

        <Faq
          title="Reading a bank statement: FAQ"
          items={[
            ["What is the difference between a debit and a credit on a bank statement?", "On a bank account, a debit is money leaving the account and a credit is money coming in. On a credit card statement, purchases are debits that increase the balance owed, and payments are credits."],
            ["What is the running balance?", "The account balance after each transaction. Each line’s balance equals the previous balance plus credits minus debits."],
            ["Why is my available balance different from the statement balance?", "The statement shows posted transactions up to the statement date. Your available balance in the app also reflects pending card payments, holds and anything posted since."],
            ["What does ACH mean on a bank statement?", "ACH is the US Automated Clearing House network. ACH lines are electronic payments such as direct deposits, bill payments and transfers."],
            ["What does DD mean on a UK bank statement?", "DD is a Direct Debit: a regular payment collected by a company you’ve authorised, such as a utility or subscription."],
            ["What do UPI and NEFT mean on an Indian bank statement?", "UPI is an instant mobile payment; NEFT is a bank transfer processed in batches. The narration usually contains the other party’s name and a reference number."],
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
