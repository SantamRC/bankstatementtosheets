import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Calculator,
  Camera,
  Check,
  ClipboardCopy,
  CreditCard,
  FileSpreadsheet,
  History,
  ArrowDownUp,
  Wand2,
  Globe2,
  Layers,
  Lock,
  PencilLine,
  ScanLine,
  ShieldCheck,
  Sheet,
  Tags,
  Timer,
  Trash2,
  Upload,
  X,
  Briefcase,
  Landmark,
  UserRound,
  EyeOff,
} from "lucide-react";
import { btn } from "@/lib/ui";
import { FREE_PAGES } from "@/lib/plans";

const BANKS = [
  "Chase", "Bank of America", "Wells Fargo", "Citi", "Capital One", "American Express", "HSBC", "Barclays",
  "Lloyds", "NatWest", "Monzo", "Revolut", "HDFC Bank", "ICICI Bank", "State Bank of India", "Axis Bank",
  "TD", "RBC", "Scotiabank", "CommBank", "Westpac", "ANZ", "DBS", "Emirates NBD",
];

export function BankStrip() {
  return (
    <section className="border-y border-line bg-card/50 py-8">
      <p className="text-center text-xs font-medium uppercase tracking-[0.18em] text-muted">
        Reads statements from thousands of banks & card issuers — no templates
      </p>
      <div className="relative mt-5 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
        <div className="flex w-max animate-[marquee_40s_linear_infinite] gap-10 pr-10">
          {[...BANKS, ...BANKS].map((b, i) => (
            <span key={i} className="whitespace-nowrap text-lg font-semibold tracking-tight text-ink/35">
              {b}
            </span>
          ))}
        </div>
      </div>
      <style>{`@keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
    </section>
  );
}

export function Comparison() {
  const rows: [string, string][] = [
    ["Template per bank — breaks when the layout changes", "Reads any layout like a human would. No templates"],
    ["Dropped rows and flipped signs go unnoticed", "Every row checked against the printed running balance"],
    ["Scanned or phone-photo PDFs fail or come out garbled", "Scanned, skewed and photographed pages supported"],
    ["Raw dump you have to clean up in Excel", "Real dates, number formats, filters & category totals"],
    ["Cryptic narrations like “UPI/9176…/PAYTM/ADD-MONEY@…”", "Clean payee names and reference IDs in their own columns"],
    ["Export only — fix mistakes after download", "Review, edit & recategorize before you export"],
    ["Confusing credits, per-file upsells", "Simple per-page pricing. Failed jobs aren't charged"],
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold text-brand">Why we built this</p>
        <h2 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
          Other bank statement converters guess. <span className="font-serif font-normal italic">We check.</span>
        </h2>
        <p className="mt-4 text-lg text-muted">
          A converter that’s 98% right means you still re-check 100% of the rows. So we made the statement prove itself.
        </p>
      </div>
      <div className="mt-12 overflow-hidden rounded-2xl border border-line-strong bg-card">
        <div className="grid grid-cols-2 border-b border-line bg-paper text-sm font-semibold">
          <div className="px-5 py-3.5 text-muted">Typical converters</div>
          <div className="flex items-center gap-2 border-l border-line px-5 py-3.5 text-ink">
            BankStatementToSheets
          </div>
        </div>
        {rows.map(([a, b]) => (
          <div key={a} className="grid grid-cols-2 border-b border-line/70 text-sm last:border-0">
            <div className="flex gap-2.5 px-5 py-4 text-muted">
              <X className="mt-0.5 size-4 shrink-0 text-danger/70" />
              {a}
            </div>
            <div className="flex gap-2.5 border-l border-line px-5 py-4 font-medium text-ink">
              <Check className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={2.5} />
              {b}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Features() {
  return (
    <section id="features" className="scroll-mt-20 bg-ink py-24 text-paper">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-lime">Features</p>
          <h2 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
            Everything between the PDF and the <span className="font-serif font-normal italic">finished sheet.</span>
          </h2>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-6">
          {/* Big reconciliation card */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-7 md:col-span-4">
            <Calculator className="size-6 text-lime" />
            <h3 className="mt-4 text-xl font-semibold">Balance reconciliation on every row</h3>
            <p className="mt-2 max-w-lg text-paper/65">
              We walk the statement line by line: previous balance + credits − debits must equal the printed balance. Rows that
              don’t tie out are flagged before you export. If a debit and credit were swapped, we fix it automatically and tell you.
            </p>
            <div className="mt-6 grid gap-2 font-mono text-[12.5px] sm:grid-cols-3">
              <div className="rounded-lg bg-white/[0.06] p-3">
                <div className="text-paper/50">Previous balance</div>
                <div className="mt-1 text-lg text-paper">8,391.97</div>
              </div>
              <div className="rounded-lg bg-white/[0.06] p-3">
                <div className="text-paper/50">− UBER *TRIP</div>
                <div className="mt-1 text-lg text-paper">23.75</div>
              </div>
              <div className="rounded-lg bg-lime p-3 text-ink">
                <div className="text-ink/60">= Printed balance</div>
                <div className="mt-1 flex items-center gap-1.5 text-lg font-semibold">
                  8,368.22 <Check className="size-4" strokeWidth={3} />
                </div>
              </div>
            </div>
          </div>
          <Feature className="md:col-span-2" icon={<Globe2 />} title="Any bank, any country">
            Day-first or month-first dates, European decimals, Indian lakh grouping, 30+ languages and every major currency.
          </Feature>
          {/* Clean names card */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-7 md:col-span-4">
            <Wand2 className="size-6 text-lime" />
            <h3 className="mt-4 text-xl font-semibold">Clean payee names, not bank gibberish</h3>
            <p className="mt-2 max-w-lg text-paper/65">
              Long narrations become a short payee name, and the UPI, NEFT, card or cheque reference moves to its own column. Prefer
              the bank’s exact wording? Switch to “Bank original” at any time. The full narration is always kept in the export.
            </p>
            <div className="mt-6 grid gap-2 font-mono text-[12.5px] sm:grid-cols-[1.4fr_auto_1fr] sm:items-center">
              <div className="rounded-lg bg-white/[0.06] p-3 break-all text-paper/55">
                UPI/917615458104/ AMAZONPAY/AMAZONPAY@APL/UTIB0000000/ 1000129101465/AMAZONPAY PURCHASE/
              </div>
              <ArrowRight className="mx-auto size-4 rotate-90 text-paper/40 sm:rotate-0" />
              <div className="rounded-lg bg-lime p-3 text-ink">
                <div className="text-base font-semibold">Amazon Pay</div>
                <div className="mt-0.5 text-ink/60">Ref 917615458104</div>
              </div>
            </div>
          </div>
          <Feature className="md:col-span-2" icon={<Camera />} title="Scanned & photographed PDFs">
            Scanned bank statements, crooked copies and phone photos saved as PDF are read with vision AI — not brittle OCR templates.
          </Feature>
          <Feature className="md:col-span-2" icon={<PencilLine />} title="Edit before you export">
            A spreadsheet-style review screen. Fix a value and the balance check re-runs instantly.
          </Feature>
          <Feature className="md:col-span-2" icon={<Sheet />} title="One-click Google Sheets">
            Creates a formatted Google Sheet in your Drive. We can only access files we create — never the rest of your Drive.
          </Feature>
          <Feature className="md:col-span-2" icon={<FileSpreadsheet />} title="Excel that’s ready to work">
            Real date cells, number formats, filters, frozen headers, a summary tab and category totals with live formulas.
          </Feature>
          <Feature className="md:col-span-2" icon={<Tags />} title="Auto-categorized">
            Every transaction gets a category — payroll, rent, software, travel — ready for a P&amp;L or tax prep.
          </Feature>
          <Feature className="md:col-span-2" icon={<Layers />} title="Batch & merge">
            Drop 12 months of statements at once and export them into one sheet, with a source column per file.
          </Feature>
          <Feature className="md:col-span-2" icon={<CreditCard />} title="Bank accounts & credit cards">
            Checking, savings and credit card statements. Purchases, payments and refunds land on the right side every time.
          </Feature>
          <Feature className="md:col-span-2" icon={<ArrowDownUp />} title="Newest-first? Handled">
            Statements printed newest-first are detected and put back in date order, so balances and totals line up.
          </Feature>
          <Feature className="md:col-span-2" icon={<History />} title="History for 30 days">
            Reopen or re-download any conversion from your dashboard for 30 days, then it’s deleted automatically.
          </Feature>
          <Feature className="md:col-span-2" icon={<ClipboardCopy />} title="QuickBooks, Xero & Tally">
            QBO for QuickBooks, OFX for Xero and Quicken, Tally XML vouchers, a clean CSV, or copy the table into any spreadsheet.
          </Feature>
        </div>
      </div>
    </section>
  );
}

function Feature({ icon, title, children, className = "" }: { icon: React.ReactNode; title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-white/[0.04] p-6 ${className}`}>
      <div className="text-lime [&>svg]:size-5">{icon}</div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-paper/60">{children}</p>
    </div>
  );
}

export function HowItWorks() {
  const steps = [
    { icon: <Upload />, title: "Drop your PDFs", body: "Drag in one statement or a whole year. Digital, scanned or photographed — up to 150 pages each." },
    { icon: <ScanLine />, title: "We extract & verify", body: "AI reads every row, then our reconciliation engine checks it against the statement’s own balances." },
    { icon: <FileSpreadsheet />, title: "Review & export", body: "Glance at the flagged rows (usually none), then download Excel, CSV or open it in Google Sheets." },
  ];
  return (
    <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold text-brand">How it works</p>
        <h2 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
          Convert a PDF bank statement to Excel in <span className="font-serif font-normal italic">under a minute.</span>
        </h2>
      </div>
      <ol className="mt-14 grid gap-6 md:grid-cols-3">
        {steps.map((s, i) => (
          <li key={s.title} className="relative rounded-2xl border border-line-strong bg-card p-7">
            <span className="num absolute top-6 right-6 text-sm text-muted">0{i + 1}</span>
            <div className="grid size-11 place-items-center rounded-xl bg-brand-soft text-brand [&>svg]:size-5">{s.icon}</div>
            <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
            <p className="mt-2 text-ink-soft">{s.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function Audiences() {
  const items = [
    { icon: <Briefcase />, title: "Accountants & bookkeepers", body: "Catch up a client’s year of statements in an afternoon instead of a week of typing." },
    { icon: <Landmark />, title: "Lenders & mortgage brokers", body: "Turn applicant statements into analyzable cash-flow data with income and spending totals." },
    { icon: <Building2 />, title: "Small businesses", body: "Feed bank activity into your books with QBO for QuickBooks, OFX for Xero, or CSV for anything else." },
    { icon: <UserRound />, title: "Personal finance & taxes", body: "See where the money went, find deductible expenses, and build your own budget sheet." },
  ];
  return (
    <section className="border-y border-line bg-card/60">
      <div className="mx-auto grid max-w-6xl gap-px overflow-hidden px-4 py-16 sm:px-6 md:grid-cols-4">
        {items.map((it) => (
          <div key={it.title} className="p-5">
            <div className="text-brand [&>svg]:size-5">{it.icon}</div>
            <h3 className="mt-3 font-semibold">{it.title}</h3>
            <p className="mt-1.5 text-sm text-muted">{it.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Security() {
  const points = [
    { icon: <EyeOff />, title: "PDFs are never stored", body: "Your file is processed in memory and discarded the moment extraction finishes." },
    { icon: <Lock />, title: "Encrypted end to end", body: "TLS everywhere in transit. Saved results are encrypted at rest in our database." },
    { icon: <Trash2 />, title: "Auto-deleted after 30 days", body: "Conversion history expires automatically — or delete it yourself in one click." },
    { icon: <ShieldCheck />, title: "Never used for AI training", body: "We use Anthropic’s commercial API, which doesn’t train models on your data." },
    { icon: <Sheet />, title: "Minimal Google access", body: "Google Sheets export uses the drive.file scope: we only see sheets we create for you." },
    { icon: <Timer />, title: "Pay only for success", body: "If a conversion fails, the pages go straight back to your balance." },
  ];
  return (
    <section id="security" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24 sm:px-6">
      <div className="grid gap-12 md:grid-cols-[1fr_1.3fr]">
        <div>
          <p className="text-sm font-semibold text-brand">Security & privacy</p>
          <h2 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
            Your statements are sensitive. <span className="font-serif font-normal italic">We act like it.</span>
          </h2>
          <p className="mt-4 text-lg text-muted">
            Bank statements hold some of the most personal data there is. We designed the product to keep as little of it as
            possible, for as short a time as possible.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {points.map((p) => (
            <div key={p.title} className="rounded-2xl border border-line-strong bg-card p-5">
              <div className="text-brand [&>svg]:size-5">{p.icon}</div>
              <h3 className="mt-3 font-semibold">{p.title}</h3>
              <p className="mt-1 text-sm text-muted">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export const FAQS: [string, string][] = [
  [
    "How do I convert a PDF bank statement to Excel?",
    "Upload the PDF on the converter, check the review table (verified rows are ticked, anything that doesn’t tie out is highlighted), then click Excel to download an .xlsx file. It takes about a minute, works for several statements at once, and the same steps give you CSV or a Google Sheet.",
  ],
  [
    "Is there a free bank statement converter?",
    `Yes. Your first ${FREE_PAGES} pages are free, with no credit card and no time limit, and they include every feature: balance verification, scanned PDFs, Excel, CSV and Google Sheets export. Paid plans start at $9/month for 150 pages.`,
  ],
  [
    "Do I need to install any software?",
    "No. It’s an online bank statement converter that runs in your browser on Windows, Mac, Linux, iPad or Android. There’s nothing to download or install.",
  ],
  [
    "How accurate is the conversion?",
    "Extraction is done by a frontier AI model that reads the page the way a person does, then every row is checked against the statement’s own running balance. When a statement prints balances, you see exactly which rows are verified — usually all of them. Anything that doesn’t tie out is highlighted for a quick look before you export.",
  ],
  [
    "Which banks and countries are supported?",
    "Any bank or card issuer, in any country. There are no per-bank templates to break. We handle day-first and month-first dates, European number formats (1.234,56), Indian lakh grouping, overdraft markers (DR/CR) and all major currencies.",
  ],
  [
    "Does it work with scanned statements?",
    "Yes. Scanned paper statements and phone photos saved as PDF are read with vision AI. Very low-resolution or heavily skewed scans may produce flagged rows that need a quick review.",
  ],
  [
    "What counts as a page?",
    "One page of the PDF you upload, regardless of how many transactions it contains. If a conversion fails, you’re not charged for it.",
  ],
  [
    "Can I convert a bank statement to Google Sheets?",
    "Yes — one click creates a formatted Google Sheet in your Drive. You can also download Excel (.xlsx) or CSV, or copy the table and paste it into any spreadsheet.",
  ],
  [
    "Can I import a bank statement into Tally?",
    "Yes. Click Tally after converting: every transaction becomes a Payment, Receipt or Contra voucher in Tally XML, posted to the ledgers you choose. Import it in TallyPrime with Import → Transactions.",
  ],
  [
    "Can I keep the bank’s original descriptions?",
    "Yes, that’s the default: descriptions stay exactly as the bank printed them. Turn on “Clean payee names” to get a short name instead (for example “Amazon Pay” rather than a long UPI string), with the transaction ID in the Reference column and the full narration kept in an “Original description” column.",
  ],
  [
    "Does it work with credit card statements?",
    "Yes. Credit card, checking and savings statements all work. For cards, purchases and fees are debits and payments and refunds are credits.",
  ],
  [
    "What about password-protected PDFs?",
    "Open the PDF with its password and save or print it as a new PDF, then upload that copy. Direct password entry is coming soon.",
  ],
  [
    "Do you store my bank statements?",
    "No. PDFs are processed in memory and never written to disk or storage. The extracted table is saved to your history so you can re-download it, and is deleted automatically after 30 days (or whenever you delete it).",
  ],
  [
    "Can I import the result into QuickBooks or Xero?",
    "Yes. Download a .qbo file for QuickBooks Online or Desktop, or an .ofx file for Xero, and upload it as a bank statement import. No column mapping needed.",
  ],
  [
    "How do I convert a bank statement to CSV?",
    "Upload the PDF, review the rows, and choose CSV. The file is UTF-8 with ISO dates (YYYY-MM-DD), separate Debit and Credit columns and a signed Amount column, so it imports cleanly into QuickBooks, Xero, Sage, YNAB or a script.",
  ],
  [
    "Can I export my Chase, Bank of America or HDFC statement to Excel?",
    "Yes. Most banks only let you download recent activity as a spreadsheet; older months, closed accounts and statements sent to you as PDFs exist only as PDF statements. Upload those PDFs here — any bank works, and we have step-by-step guides for popular banks.",
  ],
  [
    "Is it safe to upload my bank statement to an online converter?",
    "Ask any converter where your file goes. Ours is processed in memory and never stored, the connection is encrypted, the extracted table is deleted after 30 days, and your data is never used to train AI models.",
  ],
];

/** Keyword-rich internal links to every SEO page. */
export function PopularConversions({ links }: { links: [string, string][] }) {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
      <h2 className="text-center text-sm font-semibold uppercase tracking-wider text-muted">Popular conversions & guides</h2>
      <ul className="mt-5 flex flex-wrap justify-center gap-2">
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

export function FAQ() {
  return (
    <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-24 sm:px-6">
      <h2 className="text-center text-4xl font-semibold tracking-tight sm:text-5xl">
        Questions, <span className="font-serif font-normal italic">answered.</span>
      </h2>
      <div className="mt-12 divide-y divide-line rounded-2xl border border-line-strong bg-card">
        {FAQS.map(([q, a]) => (
          <details key={q} className="group px-6 py-5">
            <summary className="flex cursor-pointer items-center justify-between gap-4 font-medium">
              {q}
              <span className="grid size-6 shrink-0 place-items-center rounded-full border border-line-strong text-muted transition group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 leading-relaxed text-ink-soft">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function FinalCTA({ t }: { t?: { title: string; accent: string; body: string; cta: string } }) {
  const c = t ?? {
    title: "Stop retyping statements.",
    accent: "Start reconciling.",
    body: `Your first ${FREE_PAGES} pages are free. No credit card, no sales call — just drop in a PDF.`,
    cta: "Convert a statement free",
  };
  return (
    <section className="px-4 pb-24 sm:px-6">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-ink px-6 py-16 text-center text-paper sm:px-12">
        <div className="grid-bg absolute inset-0 opacity-[0.15] invert" />
        <div className="relative">
          <h2 className="mx-auto max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
            {c.title} <span className="font-serif font-normal italic text-lime">{c.accent}</span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-paper/65">{c.body}</p>
          <Link href="/convert" className={btn("lime", "lg", "mt-8")}>
            {c.cta} <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
