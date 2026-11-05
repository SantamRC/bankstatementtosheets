import Link from "next/link";
import { Logo } from "./Logo";
import { SITE } from "@/lib/site";

export function Footer() {
  const cols: [string, [string, string][]][] = [
    ["Product", [["Converter", "/convert"], ["Pricing", "/pricing"], ["Security", "/#security"], ["FAQ", "/#faq"]]],
    ["Convert", [["PDF to Excel", "/convert"], ["PDF to Google Sheets", "/convert"], ["PDF to CSV", "/convert"], ["Credit card statements", "/convert"]]],
    ["Company", [["Contact", "/contact"], ["Refunds & cancellation", "/refunds"], ["Privacy", "/privacy"], ["Terms", "/terms"]]],
  ];
  return (
    <footer className="mt-auto border-t border-line bg-paper">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
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
