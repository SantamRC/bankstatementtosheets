import { Check, FileText, Sparkles } from "lucide-react";

const ROWS = [
  ["2026-03-01", "Opening balance", "", "", "4,210.55"],
  ["2026-03-02", "Stripe payout", "", "2,480.00", "6,690.55"],
  ["2026-03-03", "Amazon Web Services", "312.18", "", "6,378.37"],
  ["2026-03-05", "Acme Ltd payroll", "", "3,950.00", "10,328.37"],
  ["2026-03-07", "Whole Foods Market", "86.40", "", "10,241.97"],
  ["2026-03-09", "Rent – 14 Harbour St", "1,850.00", "", "8,391.97"],
  ["2026-03-12", "Uber", "23.75", "", "8,368.22"],
];

export function HeroVisual() {
  return (
    <div className="relative mx-auto mt-14 max-w-5xl animate-rise [animation-delay:200ms]">
      <div className="absolute -inset-x-10 -top-10 -bottom-6 -z-10 rounded-[40px] bg-gradient-to-b from-brand-soft/80 via-paper to-paper blur-2xl" />
      <div className="grid overflow-hidden rounded-2xl border border-line-strong bg-card shadow-[0_30px_80px_-30px_rgba(13,21,18,0.35)] md:grid-cols-[0.8fr_1.2fr]">
        {/* PDF side */}
        <div className="relative border-b border-line bg-[#fbfbf8] p-5 md:border-r md:border-b-0">
          <div className="mb-4 flex items-center gap-2 text-xs text-muted">
            <FileText className="size-4" />
            <span className="font-medium text-ink-soft">march-statement.pdf</span>
            <span className="ml-auto rounded bg-black/5 px-1.5 py-0.5">3 pages</span>
          </div>
          <div className="relative overflow-hidden rounded-lg border border-line bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <div className="h-2.5 w-24 rounded bg-ink/80" />
                <div className="mt-1.5 h-1.5 w-16 rounded bg-ink/20" />
              </div>
              <div className="text-right">
                <div className="ml-auto h-1.5 w-20 rounded bg-ink/20" />
                <div className="mt-1.5 ml-auto h-1.5 w-14 rounded bg-ink/20" />
              </div>
            </div>
            <div className="space-y-2.5">
              {Array.from({ length: 11 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-1.5 w-8 rounded bg-ink/25" />
                  <div className="h-1.5 flex-1 rounded bg-ink/15" style={{ maxWidth: `${50 + ((i * 37) % 45)}%` }} />
                  <div className="ml-auto h-1.5 w-8 rounded bg-ink/25" />
                  <div className="h-1.5 w-10 rounded bg-ink/30" />
                </div>
              ))}
            </div>
            <div className="pointer-events-none absolute inset-x-0 top-6 h-10 animate-scan bg-gradient-to-b from-transparent via-lime/50 to-transparent" />
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-muted">
            <Sparkles className="size-3.5 text-brand" />
            Reading layout, dates & running balances…
          </div>
        </div>

        {/* Sheet side */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 border-b border-line px-4 py-2.5 text-xs">
            <span className="rounded-md bg-brand px-2 py-1 font-medium text-white">Transactions</span>
            <span className="rounded-md px-2 py-1 text-muted">Summary</span>
            <span className="rounded-md px-2 py-1 text-muted">Categories</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-[12.5px]">
              <thead className="bg-paper text-[11px] uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Description</th>
                  <th className="px-3 py-2 text-right font-medium">Debit</th>
                  <th className="px-3 py-2 text-right font-medium">Credit</th>
                  <th className="px-3 py-2 text-right font-medium">Balance</th>
                  <th className="w-8 px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r, i) => (
                  <tr
                    key={i}
                    className="animate-rise border-t border-line/70"
                    style={{ animationDelay: `${500 + i * 120}ms` }}
                  >
                    <td className="num px-3 py-2 text-muted">{r[0]}</td>
                    <td className="max-w-[200px] truncate px-3 py-2 font-medium text-ink">{r[1]}</td>
                    <td className="num px-3 py-2 text-right text-ink-soft">{r[2]}</td>
                    <td className="num px-3 py-2 text-right text-brand">{r[3]}</td>
                    <td className="num px-3 py-2 text-right">{r[4]}</td>
                    <td className="px-2 py-2">
                      {i > 0 && (
                        <span className="grid size-4 place-items-center rounded-full bg-brand-soft">
                          <Check className="size-2.5 text-brand" strokeWidth={3} />
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line bg-brand-soft/60 px-4 py-3 text-xs">
            <span className="inline-flex items-center gap-1.5 font-semibold text-brand-dark">
              <span className="grid size-4 place-items-center rounded-full bg-brand">
                <Check className="size-2.5 text-white" strokeWidth={3} />
              </span>
              48 of 48 rows reconciled
            </span>
            <span className="text-ink-soft">Closing balance ties out to the cent</span>
          </div>
        </div>
      </div>
    </div>
  );
}
