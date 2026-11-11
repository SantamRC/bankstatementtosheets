import Link from "next/link";
import { ArrowRight, Check, ChevronRight } from "lucide-react";
import { btn } from "@/lib/ui";
import { FREE_PAGES } from "@/lib/plans";
import { SITE } from "@/lib/site";

export function JsonLd({ data }: { data: object | object[] }) {
  // Static, trusted data; "<" is escaped so a string can never close the script tag.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

/** Visible breadcrumb trail + BreadcrumbList schema. Last item is the current page. */
export function Breadcrumbs({ items, home = "Home" }: { items: [string, string][]; home?: string }) {
  const all: [string, string][] = [[home, "/"], ...items];
  return (
    <>
      <nav aria-label="Breadcrumb" className="mx-auto max-w-6xl px-4 pt-6 text-xs text-muted sm:px-6">
        <ol className="flex flex-wrap items-center gap-1">
          {all.map(([label, href], i) => (
            <li key={href} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="size-3" />}
              {i < all.length - 1 ? (
                <Link href={href} className="hover:text-ink">{label}</Link>
              ) : (
                <span aria-current="page" className="text-ink-soft">{label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: all.map(([name, href], i) => ({ "@type": "ListItem", position: i + 1, name, item: `${SITE.url}${href === "/" ? "" : href}` })),
        }}
      />
    </>
  );
}

const HERO_CTA = { primary: "Convert a statement free", secondary: "See pricing", perks: [`${FREE_PAGES} free pages`, "No credit card", "PDFs never stored"] };

export function SeoHero({
  eyebrow,
  title,
  accent,
  intro,
  cta = HERO_CTA,
}: {
  eyebrow: string;
  title: string;
  accent: string;
  intro: string;
  cta?: typeof HERO_CTA;
}) {
  return (
    <section className="relative overflow-hidden">
      <div className="grid-bg absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_70%)]" />
      <div className="relative mx-auto max-w-4xl px-4 pt-10 pb-12 text-center sm:px-6 sm:pt-14">
        <p className="text-sm font-semibold text-brand">{eyebrow}</p>
        <h1 className="mt-3 text-4xl leading-[1.08] font-semibold tracking-[-0.03em] sm:text-5xl md:text-6xl">
          {title} <span className="font-serif font-normal italic text-brand">{accent}</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-ink-soft">{intro}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/convert" className={btn("primary", "lg")}>
            {cta.primary} <ArrowRight className="size-4" />
          </Link>
          <Link href="/pricing" className={btn("outline", "lg")}>
            {cta.secondary}
          </Link>
        </div>
        <ul className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted">
          {cta.perks.map((t) => (
            <li key={t} className="flex items-center gap-1.5">
              <Check className="size-4 text-brand" strokeWidth={2.5} /> {t}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Section({ title, kicker, children, className }: { title: string; kicker?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`mx-auto max-w-6xl px-4 py-14 sm:px-6 ${className ?? ""}`}>
      {kicker && <p className="text-sm font-semibold text-brand">{kicker}</p>}
      <h2 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
      <div className="mt-8">{children}</div>
    </section>
  );
}

export function Steps({ steps }: { steps: string[] }) {
  return (
    <ol className="grid gap-4 md:grid-cols-3">
      {steps.map((s, i) => (
        <li key={i} className="rounded-2xl border border-line-strong bg-card p-5">
          <span className="num grid size-8 place-items-center rounded-full bg-ink text-sm font-semibold text-paper">{i + 1}</span>
          <p className="mt-3 text-ink-soft">{s}</p>
        </li>
      ))}
    </ol>
  );
}

export function Points({ items }: { items: [string, string][] }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map(([title, body]) => (
        <div key={title} className="rounded-2xl border border-line-strong bg-card p-5">
          <Check className="size-5 text-brand" strokeWidth={2.5} />
          <h3 className="mt-3 font-semibold">{title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted">{body}</p>
        </div>
      ))}
    </div>
  );
}

/** FAQ accordion + FAQPage schema. */
export function Faq({ items, title = "Questions, answered." }: { items: [string, string][]; title?: string }) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h2 className="text-center text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
      <div className="mt-8 divide-y divide-line rounded-2xl border border-line-strong bg-card">
        {items.map(([q, a]) => (
          <details key={q} className="group px-6 py-5">
            <summary className="flex cursor-pointer items-center justify-between gap-4 font-medium">
              {q}
              <span className="grid size-6 shrink-0 place-items-center rounded-full border border-line-strong text-muted transition group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 leading-relaxed text-ink-soft">{a}</p>
          </details>
        ))}
      </div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: items.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
        }}
      />
    </section>
  );
}

export function LinkGrid({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">{title}</h2>
      <ul className="mt-4 flex flex-wrap gap-2">
        {links.map(([label, href]) => (
          <li key={href}>
            <Link href={href} className="inline-flex items-center gap-1 rounded-full border border-line-strong bg-card px-3.5 py-1.5 text-sm text-ink-soft hover:border-ink hover:text-ink">
              {label} <ArrowRight className="size-3" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Shared "why us" points used on every SEO page. */
export const CORE_POINTS: [string, string][] = [
  ["Verified to the cent", "Every row is checked against the statement's own running balance. Anything that doesn't tie out is flagged before you export."],
  ["Any layout, even scans", "A vision AI model reads the page like a person. No per-bank templates to break, and scanned or photographed statements work."],
  ["Private by design", "PDFs are processed in memory and never stored. Extracted tables are deleted after 30 days, or whenever you delete them."],
];

export const FORMAT_LINKS: [string, string][] = [
  ["Bank statement to Excel", "/bank-statement-to-excel"],
  ["Bank statement to CSV", "/bank-statement-to-csv"],
  ["Bank statement to Google Sheets", "/bank-statement-to-google-sheets"],
  ["Credit card statement to Excel", "/credit-card-statement-to-excel"],
  ["Bank statement to Tally", "/bank-statement-to-tally"],
];

export const GUIDE_LINKS: [string, string][] = [
  ["All guides", "/guides"],
  ["How to download a bank statement", "/how-to-download-bank-statement"],
  ["How to read a bank statement", "/how-to-read-a-bank-statement"],
  ["Bank reconciliation template (Excel)", "/bank-reconciliation-template-excel"],
  ["DocuClipper alternative", "/docuclipper-alternative"],
  ["Bank statement PDF password (HDFC, SBI, ICICI…)", "/bank-statement-password"],
  ["Bank statements for a mortgage", "/bank-statements-for-mortgage"],
];
