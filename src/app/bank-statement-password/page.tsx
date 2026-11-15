import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo/meta";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FinalCTA } from "@/components/landing/Sections";
import { Breadcrumbs, Faq, FORMAT_LINKS, GUIDE_LINKS, LinkGrid, Section, SeoHero, Steps } from "@/components/seo/Blocks";
import { PASSWORDS } from "@/lib/seo/passwords";

const path = "/bank-statement-password";

export const metadata: Metadata = pageMeta({
  title: "Bank Statement PDF Password List — HDFC, SBI, ICICI, Axis, Kotak, PNB & More",
  description:
    "Can’t open your bank statement PDF? Password formats for HDFC, SBI, ICICI, Axis, Kotak, Bank of Baroda, PNB, Canara and Union Bank statements, with examples, and how to unlock and convert the PDF to Excel.",
  path,
  absoluteTitle: true,
});

// Data lives in lib/seo/passwords.ts (sourced and hedged there). The email that delivers the statement is authoritative.
const ROWS = PASSWORDS.map((p) => ({
  name: p.name,
  href: `/banks/${p.slug}/statement-password`,
  acct: p.account[0],
  card: p.card?.formats[0],
}));

export default function Page() {
  return (
    <>
      <Navbar />
      <main>
        <Breadcrumbs items={[["Bank statement password", path]]} />
        <SeoHero
          eyebrow="Guide · India"
          title="How to open a password-protected bank statement PDF,"
          accent="and convert it to Excel."
          intro="Indian banks email statements as locked PDFs. Here’s the password format for HDFC, SBI, ICICI, Axis, Kotak, Bank of Baroda, PNB, Canara and Union Bank statements, and how to unlock one and convert it to Excel, CSV or Google Sheets."
        />

        <Section kicker="Start here" title="Where to find your statement password">
          <div className="max-w-3xl space-y-4 leading-relaxed text-ink-soft">
            <p>
              The email or SMS that delivered the statement almost always states the password rule, for example “your Customer ID” or “the first four
              letters of your name followed by your date of birth in DDMM format”. Read it carefully: the rule can differ between savings accounts,
              credit cards and loan statements from the same bank, and banks change it from time to time.
            </p>
            <p>
              Names are usually taken exactly as printed on the account, without spaces, and the case (CAPITALS or lowercase) matters. Dates of birth
              are usually DDMM or DDMMYYYY.
            </p>
          </div>
        </Section>

        <Section kicker="Common patterns" title="Typical password formats by bank">
          <div className="overflow-x-auto rounded-2xl border border-line-strong bg-card">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-line bg-paper">
                <tr>
                  <th className="px-5 py-3.5 font-semibold text-muted">Bank</th>
                  <th className="px-5 py-3.5 font-semibold text-muted">Account statement</th>
                  <th className="px-5 py-3.5 font-semibold text-muted">Credit card statement</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r) => (
                  <tr key={r.href} className="border-b border-line/70 align-top last:border-0">
                    <th scope="row" className="px-5 py-3.5 font-medium text-ink">
                      <Link href={r.href} className="text-brand underline-offset-2 hover:underline">{r.name}</Link>
                    </th>
                    <td className="px-5 py-3.5 text-ink-soft">
                      {r.acct.rule}
                      {r.acct.source === "bank" && <span className="ml-1 text-xs font-medium text-brand">(bank-confirmed)</span>}
                    </td>
                    <td className="px-5 py-3.5 text-ink-soft">
                      {r.card ? r.card.rule : "—"}
                      {r.card?.source === "bank" && <span className="ml-1 text-xs font-medium text-brand">(bank-confirmed)</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-muted">
            Only the rules marked bank-confirmed are published by the bank. The rest are the formats most often reported, and banks change them. The
            email that came with your statement is the authority. Click a bank for examples, alternatives and fixes.
          </p>
        </Section>

        <Section kicker="Unlock it" title="How to save an unlocked copy of your statement">
          <Steps
            steps={[
              "Upload the locked PDF on the converter as it is. Several statements at once is fine.",
              "Type the password when asked. The file is unlocked in your browser, so the password is never sent to us, and both capitals and lowercase are tried.",
              "Check the review table, where every row is verified against the balance, and download Excel, CSV, Google Sheets or Tally XML.",
            ]}
          />
          <p className="mt-4 text-sm text-muted">
            Just want an unlocked PDF? Open it with the password in Chrome, Edge or Adobe Reader, choose Print → Save as PDF, and save the copy. Only
            unlock statements that belong to you or that you are authorised to process.
          </p>
        </Section>

        <Section title="Then convert it to Excel, verified">
          <p className="max-w-3xl leading-relaxed text-ink-soft">
            Once unlocked, upload the statement on the <Link href="/convert" className="font-medium text-brand underline-offset-2 hover:underline">converter</Link>.
            We extract every transaction, turn long UPI and NEFT narrations into clean payee names with the reference in its own column, and check
            every row against the closing balance. Bank guides:{" "}
            <Link href="/banks/hdfc-bank" className="text-brand underline-offset-2 hover:underline">HDFC</Link>,{" "}
            <Link href="/banks/sbi" className="text-brand underline-offset-2 hover:underline">SBI</Link>,{" "}
            <Link href="/banks/icici-bank" className="text-brand underline-offset-2 hover:underline">ICICI</Link>,{" "}
            <Link href="/banks/axis-bank" className="text-brand underline-offset-2 hover:underline">Axis</Link>,{" "}
            <Link href="/banks/kotak-mahindra-bank" className="text-brand underline-offset-2 hover:underline">Kotak</Link>.
          </p>
        </Section>

        <Faq
          title="Bank statement password: FAQ"
          items={[
            ["What is the password for an HDFC Bank statement PDF?", "For HDFC account statements it is your numeric Customer ID, as HDFC states on its website. Credit card statements use a different rule. The email that came with the statement states the exact format, so check it first."],
            ["What is the password for an SBI statement PDF?", "SBI’s format depends on how the statement was sent (email, YONO or branch) and often combines parts of your registered mobile number and date of birth. Check the instructions in the email or app."],
            ["I typed the right password but it still fails. Why?", "Check capital vs lowercase letters, remove spaces from your name, and try DDMM vs DDMMYYYY for the date. If it still fails, download the statement again from net banking, which is often unlocked."],
            ["Can I convert a password-protected PDF directly?", "Yes. Upload the locked PDF and type the password when asked. It’s unlocked in your browser and never sent to us."],
            ["What is the password for an ICICI credit card statement?", "The last four digits of your card number. ICICI states this on its own website."],
            ["Is it safe to remove the password?", "Yes, for your own statements. Keep the unlocked copy somewhere private, or delete it after converting. We process uploads in memory and never store the PDF."],
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
