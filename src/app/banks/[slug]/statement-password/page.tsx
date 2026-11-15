import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, Info, KeyRound } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FinalCTA } from "@/components/landing/Sections";
import { Breadcrumbs, Faq, LinkGrid, Points, Section, SeoHero, Steps } from "@/components/seo/Blocks";
import { bankBySlug } from "@/lib/seo/banks";
import { COMMON_ISSUES, PASSWORDS, passwordBySlug, type PwFormat } from "@/lib/seo/passwords";
import { pageMeta } from "@/lib/seo/meta";
import { FREE_PAGES } from "@/lib/plans";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return PASSWORDS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const pw = passwordBySlug((await params).slug);
  if (!pw) return {};
  return pageMeta({
    title: `${pw.name} Statement Password: Format, Example & How to Open the PDF`,
    description: `What is the ${pw.name} statement PDF password? The format for account${pw.card ? " and credit card" : ""} statements with examples, why it fails, and how to unlock and convert the PDF to Excel.`,
    path: `/banks/${pw.slug}/statement-password`,
    absoluteTitle: true,
  });
}

const link = "font-medium text-brand underline-offset-2 hover:underline";

function Formats({ title, formats }: { title: string; formats: PwFormat[] }) {
  return (
    <div className="rounded-2xl border border-line-strong bg-card p-6">
      <h3 className="font-semibold">{title}</h3>
      <ol className="mt-4 space-y-4">
        {formats.map((f, i) => (
          <li key={f.rule} className="flex gap-3">
            <span className="num grid size-6 shrink-0 place-items-center rounded-full bg-paper text-xs font-semibold text-ink-soft">{i + 1}</span>
            <div className="min-w-0">
              <p className="font-medium text-ink">{f.rule}</p>
              {f.example && <p className="num mt-1 text-sm text-ink-soft">Example: {f.example}</p>}
              <p className="mt-1.5 inline-flex items-center gap-1 text-xs text-muted">
                {f.source === "bank" ? (
                  <>
                    <BadgeCheck className="size-3.5 text-brand" /> Stated by the bank
                  </>
                ) : (
                  <>
                    <Info className="size-3.5" /> Commonly reported, not published by the bank
                  </>
                )}
              </p>
              {f.note && <p className="mt-1 text-sm text-muted">{f.note}</p>}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default async function PasswordPage({ params }: Props) {
  const { slug } = await params;
  const pw = passwordBySlug(slug);
  const bank = bankBySlug(slug);
  if (!pw || !bank) notFound();
  const path = `/banks/${slug}/statement-password`;
  const others = PASSWORDS.filter((p) => p.slug !== slug).map((p): [string, string] => [`${p.name} password`, `/banks/${p.slug}/statement-password`]);

  return (
    <>
      <Navbar />
      <main>
        <Breadcrumbs items={[["Banks", "/banks"], [bank.name, `/banks/${slug}`], ["Statement password", path]]} />
        <SeoHero
          eyebrow={`${pw.name} · statement PDF`}
          title={`${pw.name} statement password,`}
          accent="and how to open the PDF."
          intro={`The password format for ${pw.name} account${pw.card ? " and credit card" : ""} statements, with examples, the usual reasons it fails, and how to unlock the PDF and turn it into Excel in one step.`}
          cta={{ primary: "Unlock & convert a statement", secondary: "See pricing", perks: [`${FREE_PAGES} free pages`, "Password stays in your browser", "PDFs never stored"] }}
        />

        <section className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="rounded-2xl border-2 border-brand/30 bg-card p-6">
            <p className="flex items-center gap-2 text-sm font-semibold text-brand">
              <KeyRound className="size-4" /> Short answer
            </p>
            <p className="mt-2 text-lg leading-relaxed text-ink">{pw.answer}</p>
          </div>
        </section>

        <Section kicker="Formats" title={`${pw.name} statement password format`}>
          <div className={`grid gap-4 ${pw.card ? "md:grid-cols-2" : ""}`}>
            <Formats title={`${pw.name} account statements${pw.account.length > 1 ? " (try in this order)" : ""}`} formats={pw.account} />
            {pw.card && <Formats title={pw.card.label} formats={pw.card.formats} />}
          </div>
          <p className="mt-4 text-sm text-muted">
            Banks change these rules, and the email or download screen that gave you the file always states the current one.{" "}
            {pw.officialUrl && (
              <>
                Bank source:{" "}
                <a href={pw.officialUrl} target="_blank" rel="noopener nofollow" className={link}>
                  {pw.name} help page
                </a>
                .{" "}
              </>
            )}
            Examples use fictional people. Only open statements that are yours or that you’re authorised to handle.
          </p>
          {pw.findId && (
            <div className="mt-6 rounded-2xl border border-line-strong bg-card p-6">
              <h3 className="font-semibold">{pw.findId[0]}</h3>
              <p className="mt-2 text-ink-soft">{pw.findId[1]}</p>
            </div>
          )}
        </Section>

        <Section kicker="Not opening?" title={`Why your ${pw.name} statement password isn’t working`}>
          <Points items={[...pw.issues, ...COMMON_ISSUES].slice(0, 6)} />
        </Section>

        <Section kicker="The fix" title={`Unlock your ${pw.name} statement and convert it to Excel`}>
          <Steps
            steps={[
              `Upload the locked ${pw.name} PDF on the converter. You can drop several months at once.`,
              "Type the password when asked. We unlock the file in your browser, so the password is never sent to us, and we try capitals and lowercase for you.",
              "Check the review table (every row is verified against the balance) and download Excel, CSV, Google Sheets or Tally XML.",
            ]}
          />
          <p className="mt-6 max-w-3xl leading-relaxed text-ink-soft">
            Just want an unlocked PDF? Open the statement with its password in Chrome, Edge or Adobe Reader, choose Print, pick <em>Save as PDF</em>, and
            save the copy. More on converting:{" "}
            <Link href={`/banks/${slug}`} className={link}>
              {bank.name} statement to Excel
            </Link>
            , <Link href="/bank-statement-to-tally" className={link}>bank statement to Tally</Link>, and the{" "}
            <Link href="/bank-statement-password" className={link}>password guide for all banks</Link>.
          </p>
        </Section>

        <Faq title={`${pw.name} statement password: FAQ`} items={pw.faqs} />
        <LinkGrid title="Other banks" links={[...others, ["All banks", "/bank-statement-password"]]} />

        <p className="mx-auto max-w-3xl px-4 pb-10 text-center text-xs text-muted sm:px-6">
          {bank.name} is a trademark of its respective owner. BankStatementToSheets is an independent tool and is not affiliated with or endorsed by{" "}
          {bank.name}. We never ask for your banking password, and the PDF password you type stays in your browser.
        </p>
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
