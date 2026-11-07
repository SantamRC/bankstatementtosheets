import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FinalCTA } from "@/components/landing/Sections";
import { StatementPreview } from "./StatementPreview";
import { Breadcrumbs, CORE_POINTS, Faq, FORMAT_LINKS, LinkGrid, Points, Section, SeoHero, Steps } from "./Blocks";
import { BANKS, type BankLayout } from "@/lib/seo/banks";
import type { Region } from "@/lib/seo/samples";

export interface FormatContent {
  path: string;
  crumb: string;
  eyebrow: string;
  title: string;
  accent: string;
  intro: string;
  region?: Region;
  layout?: BankLayout;
  whatYouGet: { title: string; points: [string, string][] };
  steps: string[];
  extra?: { title: string; body: React.ReactNode };
  faqs: [string, string][];
}

const GENERIC: BankLayout = {
  cols: [{ key: "date", label: "Date" }, { key: "desc", label: "Description" }, { key: "out", label: "Withdrawals" }, { key: "in", label: "Deposits" }, { key: "balance", label: "Balance" }],
  dateFmt: "MM/DD",
  balance: "every",
};

export function FormatPage({ c }: { c: FormatContent }) {
  return (
    <>
      <Navbar />
      <main>
        <Breadcrumbs items={[[c.crumb, c.path]]} />
        <SeoHero eyebrow={c.eyebrow} title={c.title} accent={c.accent} intro={c.intro} />
        <section className="mx-auto max-w-6xl px-4 sm:px-6">
          <StatementPreview region={c.region ?? "us"} layout={c.layout ?? GENERIC} bankName="bank" />
          <p className="mt-3 text-center text-xs text-muted">Fictional sample. Works with any bank’s layout, digital or scanned.</p>
        </section>
        <Section kicker="What you get" title={c.whatYouGet.title}>
          <Points items={c.whatYouGet.points} />
        </Section>
        <Section kicker="How it works" title="Three steps, about a minute">
          <Steps steps={c.steps} />
        </Section>
        {c.extra && (
          <Section title={c.extra.title}>
            <div className="max-w-3xl space-y-4 leading-relaxed text-ink-soft">{c.extra.body}</div>
          </Section>
        )}
        <Section kicker="Why BankStatementToSheets" title="Converters guess. We check.">
          <Points items={CORE_POINTS} />
        </Section>
        <Faq items={c.faqs} />
        <LinkGrid title="Popular banks" links={BANKS.map((b) => [b.name, `/banks/${b.slug}`])} />
        <LinkGrid title="Other formats" links={FORMAT_LINKS.filter(([, href]) => href !== c.path)} />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
