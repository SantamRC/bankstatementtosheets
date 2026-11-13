import { ArrowRight, Check, FileText } from "lucide-react";
import type { BankLayout, ColKey } from "@/lib/seo/banks";
import { buildSample, fmtDate, fmtMoney, nextDay, type Region } from "@/lib/seo/samples";
import { cn } from "@/lib/ui";

const NUMERIC: ColKey[] = ["out", "in", "amount", "balance"];

const T = {
  en: {
    pdf: (b: string) => `Your ${b} PDF`, layout: "sample layout", tabs: ["Transactions", "Summary", "Categories"], sheet: "your spreadsheet",
    cols: ["Date", "Description", "Category", "Debit", "Credit", "Balance"], ref: "Ref", tip: "Verified against the statement",
    verified: (v: number, t: number) => `${v} of ${t} rows verified`, ties: (o: string, c: string, cur: string) => `Opening ${o} → closing ${c} ${cur} ties out to the cent`,
  },
  es: {
    pdf: (b: string) => `Tu PDF de ${b}`, layout: "formato de ejemplo", tabs: ["Movimientos", "Resumen", "Categorías"], sheet: "tu hoja de cálculo",
    cols: ["Fecha", "Concepto", "Categoría", "Cargo", "Abono", "Saldo"], ref: "Ref.", tip: "Verificado contra el estado de cuenta",
    verified: (v: number, t: number) => `${v} de ${t} movimientos verificados`, ties: (o: string, c: string, cur: string) => `Saldo inicial ${o} → final ${c} ${cur}: cuadra al centavo`,
  },
};
// Spanish display names for the sample's categories (the product's categories are English).
const CAT_ES: Record<string, string> = {
  Payroll: "Nómina", Income: "Ingresos", "Loan Payment": "Pago de crédito", Transport: "Transporte", Utilities: "Servicios",
  "Rent & Mortgage": "Renta", Groceries: "Supermercado", "Fees & Charges": "Comisiones", Transfer: "Transferencia",
};

/** Fictional statement shown in the bank's own column layout (left) and as our verified output (right). */
export function StatementPreview({ region, layout, bankName, lang = "en" }: { region: Region; layout: BankLayout; bankName: string; lang?: "en" | "es" }) {
  const t = T[lang];
  const cat = (c: string) => (lang === "es" ? (CAT_ES[c] ?? c) : c);
  const s = buildSample(region, layout.balance);
  const m = (n: number | null | undefined) => fmtMoney(n, s.locale);
  const card = region === "us_card";
  const refLabel = layout.cols.find((c) => c.key === "ref")?.label ?? "";
  const refIsCheque = !/ref/i.test(refLabel);
  // Statements with many columns (most Indian banks) get the PDF above the output instead of beside it.
  const wide = layout.cols.length > 5;

  const cell = (r: (typeof s.rows)[number], i: number, key: ColKey) => {
    switch (key) {
      case "sno": return String(i + 1);
      case "date": return layout.dateOnce && s.rows[i - 1]?.date === r.date ? "" : fmtDate(r.date, layout.dateFmt);
      case "postDate": return fmtDate(nextDay(r.date), layout.dateFmt);
      case "valueDate": return fmtDate(r.date, layout.dateFmt);
      case "desc": return r.desc;
      // A "Ref No" column carries the reference; a cheque-only column stays blank for non-cheque rows.
      case "ref": return refIsCheque ? "" : (r.ref ?? "");
      case "type": return r.type ?? "";
      case "out": return m(r.out);
      case "in": return m(r.in);
      case "amount": {
        const v = layout.amountSign === "card" ? (r.out ?? 0) - (r.in ?? 0) : (r.in ?? 0) - (r.out ?? 0);
        return m(v);
      }
      case "balance": return r.balance == null ? "" : `${m(r.balance)}${layout.balanceSuffix ? ` ${layout.balanceSuffix}` : ""}`;
    }
  };

  const pdfTable = (rows: { r: (typeof s.rows)[number]; i: number }[]) => (
    <table className="w-full min-w-[480px] text-left font-mono text-[10.5px] leading-snug">
      <thead>
        <tr className="border-b border-ink/30">
          {layout.cols.map((c) => (
            <th key={c.key} className={cn("px-1.5 py-1.5 align-bottom font-semibold text-ink", NUMERIC.includes(c.key) && "text-right")}>
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(({ r, i }) => (
          <tr key={i} className="border-b border-ink/[0.07] align-top">
            {layout.cols.map((c) => (
              <td
                key={c.key}
                className={cn(
                  "px-1.5 py-1.5 text-ink-soft",
                  NUMERIC.includes(c.key) && "text-right whitespace-nowrap",
                  c.key === "desc" && "max-w-[200px] break-words",
                  (c.key === "date" || c.key === "valueDate" || c.key === "postDate") && "whitespace-nowrap",
                )}
              >
                {cell(r, i, c.key)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );

  const indexed = s.rows.map((r, i) => ({ r, i }));
  const verified = s.reconciliation.verifiedRows + s.reconciliation.fixedRows;
  const total = s.transactions.length;

  return (
    <div className={cn("grid overflow-hidden rounded-2xl border border-line-strong bg-card shadow-[0_30px_80px_-40px_rgba(13,21,18,0.35)]", !wide && "lg:grid-cols-2")}>
      <div className={cn("min-w-0 border-b border-line bg-[#fbfbf8] p-4 sm:p-5", !wide && "lg:border-r lg:border-b-0")}>
        <div className="mb-3 flex items-center gap-2 text-xs text-muted">
          <FileText className="size-4" />
          <span className="font-medium text-ink-soft">{t.pdf(bankName)}</span>
          <span className="ml-auto rounded bg-black/5 px-1.5 py-0.5">{t.layout}</span>
        </div>
        <div className="overflow-x-auto rounded-lg border border-line bg-white p-3 shadow-sm">
          {layout.sections ? (
            <div className="space-y-4">
              {[indexed.filter(({ r }) => r.in), indexed.filter(({ r }) => r.out)].map((rows, k) => (
                <div key={k}>
                  <p className="mb-1 font-mono text-[11px] font-semibold text-ink">{layout.sections![k]}</p>
                  {pdfTable(rows)}
                </div>
              ))}
            </div>
          ) : (
            pdfTable(indexed)
          )}
        </div>
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-1.5 border-b border-line px-4 py-2.5 text-xs">
          <span className="rounded-md bg-brand px-2 py-1 font-medium text-white">{t.tabs[0]}</span>
          <span className="rounded-md px-2 py-1 text-muted">{t.tabs[1]}</span>
          <span className="rounded-md px-2 py-1 text-muted">{t.tabs[2]}</span>
          <ArrowRight className="ml-auto size-3.5 text-muted" />
          <span className="text-muted">{t.sheet}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-[12px]">
            <thead className="bg-paper text-[10.5px] uppercase tracking-wide text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">{t.cols[0]}</th>
                <th className="px-3 py-2 font-medium">{t.cols[1]}</th>
                <th className="px-3 py-2 font-medium">{t.cols[2]}</th>
                <th className="px-3 py-2 text-right font-medium">{t.cols[3]}</th>
                <th className="px-3 py-2 text-right font-medium">{t.cols[4]}</th>
                {!card && <th className="px-3 py-2 text-right font-medium">{t.cols[5]}</th>}
                <th className="w-7 px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {s.transactions.map((tx) => (
                <tr key={tx.id} className="border-t border-line/70">
                  <td className="num whitespace-nowrap px-3 py-2 text-muted">{tx.date}</td>
                  <td className="max-w-[180px] px-3 py-2">
                    <div className="truncate font-medium text-ink">{tx.payee}</div>
                    {tx.reference && <div className="num truncate text-[10.5px] text-muted">{t.ref} {tx.reference}</div>}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-ink-soft">{cat(tx.category)}</td>
                  <td className="num px-3 py-2 text-right text-ink-soft">{m(tx.debit)}</td>
                  <td className="num px-3 py-2 text-right text-brand">{m(tx.credit)}</td>
                  {!card && <td className="num px-3 py-2 text-right">{m(tx.balance)}</td>}
                  <td className="px-2 py-2">
                    {tx.status !== "unchecked" && (
                      <span className="grid size-4 place-items-center rounded-full bg-brand-soft" title={t.tip}>
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
          {card ? (
            <>
              <span className="inline-flex items-center gap-1.5 font-semibold text-brand-dark">
                <span className="grid size-4 place-items-center rounded-full bg-brand">
                  <Check className="size-2.5 text-white" strokeWidth={3} />
                </span>
                {t.verified(verified, total)}
              </span>
              <span className="text-ink-soft">
                Previous balance {m(s.opening)} + charges {m(s.reconciliation.totalDebits)} − payments {m(s.reconciliation.totalCredits)} = new balance {m(s.closing)} {s.currency}, to the cent
              </span>
            </>
          ) : (
            <>
              <span className="inline-flex items-center gap-1.5 font-semibold text-brand-dark">
                <span className="grid size-4 place-items-center rounded-full bg-brand">
                  <Check className="size-2.5 text-white" strokeWidth={3} />
                </span>
                {t.verified(verified, total)}
              </span>
              <span className="text-ink-soft">
                {t.ties(m(s.opening), m(s.closing), s.currency)}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
