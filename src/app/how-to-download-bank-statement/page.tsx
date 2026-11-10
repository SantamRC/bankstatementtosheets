import type { Metadata } from "next";
import Link from "next/link";
import { HREFLANG, pageMeta } from "@/lib/seo/meta";
import { BANKS } from "@/lib/seo/banks";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FinalCTA } from "@/components/landing/Sections";
import { Breadcrumbs, Faq, FORMAT_LINKS, GUIDE_LINKS, LinkGrid, Points, Section, SeoHero } from "@/components/seo/Blocks";

const path = HREFLANG.download.en;

export const metadata: Metadata = pageMeta({
  title: "How to Download a Bank Statement (PDF) — Online, App or Branch",
  description:
    "How to get a bank statement: download it as a PDF from online banking or your bank’s app, request an older or stamped copy, plus step-by-step instructions for 23 US, UK and Indian banks.",
  path,
  absoluteTitle: true,
  languages: HREFLANG.download,
});

const COUNTRIES = ["United States", "United Kingdom", "India"] as const;
const link = "font-medium text-brand underline-offset-2 hover:underline";

export default function Page() {
  return (
    <>
      <Navbar />
      <main>
        <Breadcrumbs items={[["Guides", "/guides"], ["How to download a bank statement", path]]} />
        <SeoHero
          eyebrow="Guide"
          title="How to download a bank statement,"
          accent="in about two minutes."
          intro="Most banks let you download any recent monthly statement as a PDF from online banking or the app. Here’s how, where to get older or official copies, and the exact steps for 23 banks in the US, UK and India."
        />

        <Section kicker="Your options" title="Four ways to get a bank statement">
          <Points
            items={[
              ["Online banking or the app (fastest)", "Sign in, open the account, find Statements (sometimes under Documents or eStatements), pick the month and download the PDF. Most banks keep several years online."],
              ["Email or eStatements", "Turn on paperless statements and each month’s PDF is emailed or posted to your inbox in online banking. In India these PDFs are usually password-protected."],
              ["Branch, phone or post", "For older periods, closed accounts or a stamped and signed copy (visas, some lenders, courts), ask the bank. Some charge a small fee per statement."],
            ]}
          />
          <div className="mt-6 max-w-3xl space-y-4 leading-relaxed text-ink-soft">
            <p>
              <strong className="text-ink">Statement vs. transaction history.</strong> Many banks also offer a CSV or Excel “activity” download. That is
              handy, but it usually covers only recent months, has no opening or closing balance, and isn’t an official document. Lenders, accountants
              and tax authorities normally want the monthly PDF statement, which you can then{" "}
              <Link href="/bank-statement-to-excel" className={link}>convert to Excel</Link> when you need the numbers in a spreadsheet.
            </p>
            <p>
              <strong className="text-ink">ATM and SMS mini statements</strong> show only the last few transactions. They are not a substitute for a
              full statement.
            </p>
          </div>
        </Section>

        <Section kicker="Step by step" title="How to download a statement from your bank">
          <p className="max-w-3xl text-sm text-muted">
            Menu names change when banks redesign their apps, so treat these as a guide. Click a bank for its statement layout and conversion tips.
          </p>
          <div className="mt-6 space-y-10">
            {COUNTRIES.map((country) => (
              <div key={country}>
                <h3 className="text-xl font-semibold">{country}</h3>
                <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {BANKS.filter((b) => b.country === country).map((b) => (
                    <div key={b.slug} className="rounded-2xl border border-line-strong bg-card p-5">
                      <h4 className="font-semibold">
                        <Link href={`/banks/${b.slug}`} className="hover:text-brand">How to download a {b.name} statement</Link>
                      </h4>
                      <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-ink-soft">
                        {b.download.map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ol>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-muted">
            Bank names are trademarks of their owners. BankStatementToSheets is not affiliated with any bank. In India? Read this guide{" "}
            <Link href={HREFLANG.download["hi-IN"]} hrefLang="hi" lang="hi" className={link}>हिंदी में</Link>.
          </p>
        </Section>

        <Section kicker="Common situations" title="Older statements, official copies and locked PDFs">
          <div className="max-w-3xl space-y-4 leading-relaxed text-ink-soft">
            <p>
              <strong className="text-ink">Older than what’s online.</strong> Banks keep statements for years but only show a limited period online.
              Call the bank or visit a branch and ask for the months you need; expect a few days’ wait and possibly a fee.
            </p>
            <p>
              <strong className="text-ink">For a mortgage, visa or loan.</strong> A downloaded PDF statement is usually accepted, but some institutions
              want a stamped copy or a statement sent directly by the bank. Check before you apply. See{" "}
              <Link href="/bank-statements-for-mortgage" className={link}>bank statements for a mortgage</Link>.
            </p>
            <p>
              <strong className="text-ink">The PDF asks for a password.</strong> Common for emailed statements in India. See{" "}
              <Link href="/bank-statement-password" className={link}>where to find your statement password</Link>.
            </p>
            <p>
              <strong className="text-ink">You need the transactions in a spreadsheet.</strong> Upload the PDF to the{" "}
              <Link href="/convert" className={link}>converter</Link>: you get Excel, CSV or Google Sheets with every row checked against the
              statement’s balances.
            </p>
          </div>
        </Section>

        <Faq
          title="Downloading bank statements: FAQ"
          items={[
            ["How do I get my bank statement online?", "Sign in to online banking or your bank’s app, open the account, go to Statements (or Documents / eStatements), choose the month and download the PDF."],
            ["How far back can I download bank statements?", "It depends on the bank. Many show several years online; some show only 12–18 months. For older statements, ask the bank directly."],
            ["Is a downloaded bank statement official?", "A PDF statement downloaded from online banking is the same document the bank would post, and most lenders accept it. Some visa offices and lenders ask for a stamped copy or one sent directly by the bank."],
            ["Can I get a bank statement from an ATM?", "ATMs print a mini statement with only the last few transactions. For a full statement, use online banking, the app or a branch."],
            ["Do banks charge for statements?", "Downloading from online banking is free at most banks. Paper copies, older statements and stamped statements sometimes carry a fee."],
            ["How do I convert a bank statement PDF to Excel?", "Upload the PDF to BankStatementToSheets. It extracts every transaction, checks it against the statement’s running balance and gives you an Excel, CSV or Google Sheets file."],
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
