import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { HeroVisual } from "@/components/landing/HeroVisual";
import { Audiences, BankStrip, Comparison, FAQ, FAQS, Features, FinalCTA, HowItWorks, Security } from "@/components/landing/Sections";
import { Pricing } from "@/components/landing/Pricing";
import { btn } from "@/lib/ui";
import { FREE_PAGES, PLANS } from "@/lib/plans";
import { SITE } from "@/lib/site";

export default function Home() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: SITE.name,
      url: SITE.url,
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      description: SITE.description,
      offers: PLANS.flatMap((p) =>
        (["USD", "EUR", "INR"] as const).map((c) => ({ "@type": "Offer", name: p.name, price: p.price[c].monthly, priceCurrency: c })),
      ),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQS.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    },
  ];

  return (
    <>
      <Navbar />
      <main>
        <section className="relative overflow-hidden">
          <div className="grid-bg absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_70%)]" />
          <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-20 text-center sm:px-6 sm:pt-24">
            <Link
              href="#features"
              className="inline-flex animate-rise items-center gap-2 rounded-full border border-line-strong bg-card px-3 py-1 text-xs font-medium text-ink-soft shadow-sm hover:border-ink"
            >
              <span className="rounded-full bg-lime px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink">New</span>
              Every row checked against your running balance
              <ArrowRight className="size-3" />
            </Link>
            <h1 className="mx-auto mt-6 max-w-4xl animate-rise text-[2.6rem] leading-[1.05] font-semibold tracking-[-0.03em] [animation-delay:60ms] sm:text-6xl md:text-7xl">
              Bank statements to spreadsheets,{" "}
              <br className="hidden sm:block" />
              <span className="font-serif font-normal italic text-brand sm:whitespace-nowrap">verified to the cent.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl animate-rise text-lg text-ink-soft [animation-delay:120ms] sm:text-xl">
              Drop in any PDF statement — digital or scanned, any bank, any country. Get a clean Excel file or Google Sheet in
              seconds, with every transaction reconciled against the statement’s own balances.
            </p>
            <div className="mt-9 flex animate-rise flex-col items-center justify-center gap-3 [animation-delay:180ms] sm:flex-row">
              <Link href="/convert" className={btn("primary", "lg")}>
                Convert your first statement <ArrowRight className="size-4" />
              </Link>
              <Link href="#how" className={btn("outline", "lg")}>
                See how it works
              </Link>
            </div>
            <ul className="mt-6 flex animate-rise flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted [animation-delay:240ms]">
              {[`${FREE_PAGES} free pages`, "No credit card", "PDFs never stored"].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <Check className="size-4 text-brand" strokeWidth={2.5} /> {t}
                </li>
              ))}
            </ul>
            <HeroVisual />
          </div>
        </section>
        <BankStrip />
        <Comparison />
        <Features />
        <HowItWorks />
        <Audiences />
        <Pricing />
        <Security />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
