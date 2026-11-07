import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FinalCTA } from "@/components/landing/Sections";
import { StatementPreview } from "@/components/seo/StatementPreview";
import { Breadcrumbs, CORE_POINTS, Faq, FORMAT_LINKS, LinkGrid, Points, Section, SeoHero, Steps } from "@/components/seo/Blocks";
import { BANKS, bankBySlug } from "@/lib/seo/banks";
import { pageMeta } from "@/lib/seo/meta";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return BANKS.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const bank = bankBySlug((await params).slug);
  if (!bank) return {};
  const title = `Convert ${bank.query}s to Excel, CSV & Google Sheets`;
  const description = `Convert ${bank.name} PDF statements to Excel, CSV or Google Sheets in seconds. Every row is checked against the statement's balance. ${bank.country === "India" ? "UPI references extracted. " : ""}Scanned PDFs work. 20 pages free.`;
  return pageMeta({ title, description, path: `/banks/${bank.slug}` });
}

export default async function BankPage({ params }: Props) {
  const bank = bankBySlug((await params).slug);
  if (!bank) notFound();

  const related = BANKS.filter((b) => b.country === bank.country && b.slug !== bank.slug).map((b): [string, string] => [b.name, `/banks/${b.slug}`]);

  return (
    <>
      <Navbar />
      <main>
        <Breadcrumbs items={[["Banks", "/banks"], [bank.name, `/banks/${bank.slug}`]]} />
        <SeoHero
          eyebrow={`${bank.name} statement converter`}
          title={`Convert ${bank.name} statements to Excel & Google Sheets,`}
          accent="verified to the cent."
          intro={bank.intro}
        />

        <section className="mx-auto max-w-6xl px-4 sm:px-6">
          <StatementPreview region={bank.region} layout={bank.layout} bankName={bank.name} />
          <p className="mt-3 text-center text-xs text-muted">
            Fictional sample in a typical {bank.name} column layout. Real column names vary by account type and year — we read whatever layout you upload.
          </p>
        </section>

        <Section kicker="Step by step" title={`How to download your ${bank.name} statement as a PDF`}>
          <Steps steps={bank.download} />
          <p className="mt-4 text-sm text-muted">
            Menu names change from time to time. If you can’t find them, search the app or website for “statements”. Then upload the PDF on the{" "}
            <Link href="/convert" className="font-medium text-brand underline-offset-2 hover:underline">converter</Link>, check the review table, and export.
          </p>
        </Section>

        <Section kicker="Built for this layout" title={`What’s tricky about ${bank.name} statements — and how we handle it`}>
          <Points items={bank.quirks} />
        </Section>

        <Section kicker="Why BankStatementToSheets" title="More than a PDF-to-Excel dump">
          <Points items={CORE_POINTS} />
          <p className="mt-6 text-ink-soft">
            Works with {bank.accounts}. Export to a formatted Excel workbook (Transactions, Summary and Categories sheets with live formulas), CSV, or Google Sheets.
          </p>
        </Section>

        <Faq title={`${bank.name} statement conversion: FAQ`} items={bank.faqs} />

        {related.length > 0 && <LinkGrid title={`Other banks in ${bank.country === "United States" ? "the US" : bank.country === "United Kingdom" ? "the UK" : bank.country}`} links={[...related, ["All banks", "/banks"]]} />}
        <LinkGrid title="Convert to" links={FORMAT_LINKS} />

        <p className="mx-auto max-w-3xl px-4 pb-10 text-center text-xs text-muted sm:px-6">
          {bank.name} is a trademark of its respective owner. BankStatementToSheets is an independent tool and is not affiliated with or endorsed by {bank.name}.
        </p>
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
