import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo/meta";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FinalCTA } from "@/components/landing/Sections";
import { Breadcrumbs, Faq, FORMAT_LINKS, GUIDE_LINKS, LinkGrid, Section, SeoHero, Steps } from "@/components/seo/Blocks";

const path = "/bank-statement-password";

export const metadata: Metadata = pageMeta({
  title: "Bank Statement PDF Password — HDFC, SBI, ICICI, Axis & Kotak",
  description:
    "Can’t open your bank statement PDF? Where to find the password for HDFC, SBI, ICICI, Axis and Kotak statements, and how to save an unlocked copy so you can convert it to Excel.",
  path,
  absoluteTitle: true,
});

// Formats are deliberately hedged: published sources disagree and banks change them. The email that delivers the statement is authoritative.
const BANKS: [string, string, string][] = [
  ["HDFC Bank", "Usually your Customer ID", "Often built from your name and date of birth, or card digits and date of birth"],
  ["SBI", "Often a mix of your registered mobile number and date of birth; varies by channel (email, YONO, branch)", "Often your date of birth combined with card digits"],
  ["ICICI Bank", "Often the first four letters of your name plus your date and month of birth", "Often the same name-plus-birthday pattern"],
  ["Axis Bank", "Often the first four letters of your name combined with your Customer ID or date of birth", "Often a name-plus-birthday pattern"],
  ["Kotak Mahindra Bank", "Often your CRN (Customer Relationship Number)", "Often the first four letters of your name plus your date and month of birth"],
];

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
          intro="Indian banks email statements as locked PDFs. Here’s where to find the password for HDFC, SBI, ICICI, Axis and Kotak statements, and how to save an unlocked copy you can convert to Excel, CSV or Google Sheets."
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
                {BANKS.map(([bank, acct, card]) => (
                  <tr key={bank} className="border-b border-line/70 align-top last:border-0">
                    <th scope="row" className="px-5 py-3.5 font-medium text-ink">{bank}</th>
                    <td className="px-5 py-3.5 text-ink-soft">{acct}</td>
                    <td className="px-5 py-3.5 text-ink-soft">{card}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-muted">
            These are the formats most often reported, not official rules, and they change. Always check the instructions in your bank’s email, or
            call your bank. We never ask for or store your password.
          </p>
        </Section>

        <Section kicker="Unlock it" title="How to save an unlocked copy of your statement">
          <Steps
            steps={[
              "Open the PDF in Chrome, Edge, Adobe Acrobat Reader or your phone’s PDF viewer and enter the password.",
              "Choose Print, and pick “Save as PDF” (or “Microsoft Print to PDF”) as the printer. Save the new file.",
              "The new copy opens without a password. Upload it to the converter and download Excel, CSV or a Google Sheet.",
            ]}
          />
          <p className="mt-4 text-sm text-muted">
            Shortcut: statements downloaded directly from net banking are often not locked at all. Built-in password entry is coming soon. Only unlock
            statements that belong to you or that you are authorised to process.
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
            ["What is the password for an HDFC Bank statement PDF?", "For HDFC account statements it is usually your Customer ID. Credit card statements use a different rule. The email that came with the statement states the exact format, so check it first."],
            ["What is the password for an SBI statement PDF?", "SBI’s format depends on how the statement was sent (email, YONO or branch) and often combines parts of your registered mobile number and date of birth. Check the instructions in the email or app."],
            ["I typed the right password but it still fails. Why?", "Check capital vs lowercase letters, remove spaces from your name, and try DDMM vs DDMMYYYY for the date. If it still fails, download the statement again from net banking, which is often unlocked."],
            ["Can I convert a password-protected PDF directly?", "Not yet. Save an unlocked copy first (Print → Save as PDF), then upload it. Built-in password entry is coming soon."],
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
