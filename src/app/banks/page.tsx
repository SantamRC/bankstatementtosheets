import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo/meta";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FinalCTA } from "@/components/landing/Sections";
import { Breadcrumbs, CORE_POINTS, FORMAT_LINKS, LinkGrid, Points, Section, SeoHero } from "@/components/seo/Blocks";
import { BANKS, COUNTRIES } from "@/lib/seo/banks";

export const metadata: Metadata = pageMeta({
  title: "Bank Statement Converter for Any Bank — Chase, HSBC, HDFC & More",
  description: "Convert PDF statements from Chase, Bank of America, Wells Fargo, Barclays, HSBC, Lloyds, HDFC, ICICI, SBI and thousands of other banks to Excel, CSV or Google Sheets. No templates.",
  path: "/banks",
  absoluteTitle: true,
});

export default function BanksPage() {
  return (
    <>
      <Navbar />
      <main>
        <Breadcrumbs items={[["Banks", "/banks"]]} />
        <SeoHero
          eyebrow="Supported banks"
          title="Every bank. Every layout."
          accent="No templates."
          intro="Our converter reads statements the way a person does, so it works with any bank or card issuer in any country — including ones not listed here. These guides cover the quirks of popular banks."
        />
        {COUNTRIES.map((country) => (
          <Section key={country} title={country}>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {BANKS.filter((b) => b.country === country).map((b) => (
                <li key={b.slug}>
                  <Link href={`/banks/${b.slug}`} className="group flex h-full flex-col rounded-2xl border border-line-strong bg-card p-5 hover:border-ink">
                    <span className="flex items-center justify-between font-semibold">
                      {b.name} statement to Excel <ArrowRight className="size-4 text-muted transition group-hover:translate-x-0.5 group-hover:text-ink" />
                    </span>
                    <span className="mt-1.5 text-sm text-muted">{b.accounts}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
        ))}
        <Section title="Don’t see your bank?">
          <p className="max-w-3xl text-ink-soft">
            It still works. There are no per-bank templates: the same engine reads US, UK, EU, Indian, Canadian, Australian and Middle-East statements,
            with day-first or month-first dates, European number formats (1.234,56), lakh grouping and DR/CR markers. Try your statement with the free
            pages — failed conversions are never charged.
          </p>
          <div className="mt-8">
            <Points items={CORE_POINTS} />
          </div>
        </Section>
        <LinkGrid title="Convert to" links={FORMAT_LINKS} />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
