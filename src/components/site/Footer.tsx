import Link from "next/link";
import { Logo } from "./Logo";
import { SITE } from "@/lib/site";

export function Footer() {
  const cols: [string, [string, string][]][] = [
    ["Product", [["Converter", "/convert"], ["Pricing", "/pricing"], ["Security", "/#security"], ["FAQ", "/#faq"]]],
    [
      "Convert",
      [
        ["Bank statement to Excel", "/bank-statement-to-excel"],
        ["Bank statement to CSV", "/bank-statement-to-csv"],
        ["Bank statement to Google Sheets", "/bank-statement-to-google-sheets"],
        ["Credit card statement to Excel", "/credit-card-statement-to-excel"],
      ],
    ],
    [
      "Banks",
      [
        ["Chase", "/banks/chase"],
        ["Bank of America", "/banks/bank-of-america"],
        ["Barclays", "/banks/barclays"],
        ["HSBC", "/banks/hsbc"],
        ["HDFC Bank", "/banks/hdfc-bank"],
        ["SBI", "/banks/sbi"],
        ["All banks", "/banks"],
      ],
    ],
    [
      "Guides",
      [
        ["Download a bank statement", "/how-to-download-bank-statement"],
        ["Read a bank statement", "/how-to-read-a-bank-statement"],
        ["Reconciliation template", "/bank-reconciliation-template-excel"],
        ["DocuClipper alternative", "/docuclipper-alternative"],
        ["Bank statement password", "/bank-statement-password"],
        ["Statements for a mortgage", "/bank-statements-for-mortgage"],
        ["All guides", "/guides"],
      ],
    ],
    ["Company", [["Contact", "/contact"], ["Refunds & cancellation", "/refunds"], ["Privacy", "/privacy"], ["Terms", "/terms"]]],
  ];
  return (
    <footer className="mt-auto border-t border-line bg-paper">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-[1.4fr_1fr_1.3fr_1fr_1fr_1fr]">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-sm text-muted">
            Turn PDF bank statements into clean, verified spreadsheets. Built for accountants, bookkeepers and anyone who hates retyping numbers.
          </p>
        </div>
        {cols.map(([title, links]) => (
          <div key={title}>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">{title}</h3>
            <ul className="space-y-2 text-sm">
              {links.map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-ink-soft hover:text-ink">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-muted sm:flex-row sm:justify-between sm:px-6">
          <p>© 2026 {SITE.domain}. All rights reserved.</p>
          <p>PDFs are processed in memory and never stored.</p>
        </div>
      </div>
    </footer>
  );
}
