import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HREFLANG, pageMeta } from "@/lib/seo/meta";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FinalCTA } from "@/components/landing/Sections";
import { Breadcrumbs, FORMAT_LINKS, LinkGrid, Section } from "@/components/seo/Blocks";

const path = "/guides";

export const metadata: Metadata = pageMeta({
  title: "Bank Statement Guides — Download, Read, Reconcile & Convert",
  description:
    "Practical guides for bank statements: how to download and read them, open password-protected PDFs, reconcile in Excel with a free template, and what lenders check for a mortgage.",
  path,
  absoluteTitle: true,
});

const GUIDES: [string, string, string, string?][] = [
  ["How to download a bank statement", "/how-to-download-bank-statement", "Online banking, apps and branches, with step-by-step instructions for 23 US, UK and Indian banks."],
  ["How to read a bank statement", "/how-to-read-a-bank-statement", "Every section and column explained, what ACH, DD, BGC, NEFT and UPI mean, and how to check a statement for errors."],
  ["Free bank reconciliation template (Excel)", "/bank-reconciliation-template-excel", "A four-sheet workbook with live formulas that flags unmatched transactions. No signup."],
  ["Bank statement PDF password", "/bank-statement-password", "Where to find the password for HDFC, SBI, ICICI, Axis and Kotak statements, and how to save an unlocked copy."],
  ["Bank statements for a mortgage", "/bank-statements-for-mortgage", "What lenders look for, how many months they want, and how to prepare your statements."],
  ["DocuClipper alternative", "/docuclipper-alternative", "An honest price and feature comparison, including where DocuClipper is the better fit."],
  ["बैंक स्टेटमेंट कैसे निकाले", HREFLANG.download["hi-IN"], "नेट बैंकिंग, ऐप और ब्रांच से स्टेटमेंट निकालने का तरीका, 9 भारतीय बैंकों के स्टेप के साथ।", "hi"],
  ["Convertir estado de cuenta PDF a Excel", HREFLANG.excel["es-MX"], "Convierte tu estado de cuenta bancario a Excel, verificado al centavo.", "es"],
];

export default function Page() {
  return (
    <>
      <Navbar />
      <main>
        <Breadcrumbs items={[["Guides", path]]} />
        <section className="mx-auto max-w-4xl px-4 pt-10 pb-4 text-center sm:px-6 sm:pt-14">
          <p className="text-sm font-semibold text-brand">Guides</p>
          <h1 className="mt-3 text-4xl leading-[1.08] font-semibold tracking-[-0.03em] sm:text-5xl">
            Bank statements, <span className="font-serif font-normal italic text-brand">explained.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-ink-soft">
            Practical, no-fluff guides to getting, reading, reconciling and converting bank statements.
          </p>
        </section>
        <Section title="All guides">
          <div className="grid gap-4 md:grid-cols-2">
            {GUIDES.map(([title, href, body, lang]) => (
              <Link
                key={href}
                href={href}
                lang={lang}
                hrefLang={lang}
                className="group rounded-2xl border border-line-strong bg-card p-6 transition hover:border-ink"
              >
                <h2 className="flex items-center justify-between gap-3 text-lg font-semibold">
                  {title} <ArrowRight className="size-4 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-ink" />
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
              </Link>
            ))}
          </div>
        </Section>
        <LinkGrid title="Convert to" links={FORMAT_LINKS} />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
