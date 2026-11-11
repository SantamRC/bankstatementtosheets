"use client";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ChevronDown, Download, X } from "lucide-react";
import type { Category, Statement } from "@/lib/extraction/schema";
import { CATEGORIES } from "@/lib/extraction/schema";
import { baseName } from "@/lib/export/build";
import { accountKey, defaultBankLedger, tallyLedgersUsed, toTallyXml, type TallyOptions } from "@/lib/export/tally";
import { saveBlob } from "@/lib/export/xlsx";
import { btn, cn } from "@/lib/ui";

const KEY = "bsts.tally";
interface Saved {
  bankLedgers: Record<string, string>;
  defaultLedger: string;
  categoryLedgers: Partial<Record<Category, string>>;
}
const DEFAULTS: Saved = { bankLedgers: {}, defaultLedger: "Suspense", categoryLedgers: { Cash: "Cash" } };

function load(): Saved {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "null");
    return v ? { ...DEFAULTS, ...v } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

const input = "w-full rounded-lg border border-line-strong bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink";

export function TallyDialog({ statements, style, onClose }: { statements: Statement[]; style: "clean" | "original"; onClose: () => void }) {
  // Only rendered after a click, so reading localStorage during the first render is safe.
  const [saved, setSaved] = useState<Saved>(load);
  const [showMap, setShowMap] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const accounts = useMemo(() => {
    const m = new Map<string, Statement>();
    for (const s of statements) if (!m.has(accountKey(s))) m.set(accountKey(s), s);
    return [...m.entries()];
  }, [statements]);
  const usedCats = useMemo(() => CATEGORIES.filter((c) => statements.some((s) => s.transactions.some((t) => t.category === c))), [statements]);
  const flagged = statements.reduce((n, s) => n + s.transactions.filter((t) => t.status === "mismatch").length, 0);
  const cardLike = statements.some((s) => s.accountType === "credit_card");

  const opts: TallyOptions = {
    bankLedgers: Object.fromEntries(accounts.map(([k, s]) => [k, saved.bankLedgers[k]?.trim() || defaultBankLedger(s)])),
    defaultLedger: saved.defaultLedger.trim() || "Suspense",
    categoryLedgers: saved.categoryLedgers,
    cashLedgers: ["Cash"],
    style,
  };
  const ledgers = tallyLedgersUsed(statements, opts);
  const count = statements.reduce((n, s) => n + s.transactions.filter((t) => (t.debit ?? 0) !== (t.credit ?? 0)).length, 0);

  const update = (patch: Partial<Saved>) => {
    const next = { ...saved, ...patch };
    setSaved(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  };

  const download = () => {
    saveBlob(new Blob([toTallyXml(statements, opts)], { type: "application/xml;charset=utf-8" }), `${baseName(statements)} - Tally.xml`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tally-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-paper p-6 text-ink shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="tally-title" className="text-lg font-semibold">Export to Tally</h2>
            <p className="mt-1 text-sm text-muted">
              {count} vouchers for TallyPrime or Tally.ERP 9: money out as Payment, money in as Receipt, cash as Contra.
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1 text-muted hover:bg-black/5 hover:text-ink">
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {accounts.map(([k, s]) => (
            <label key={k} className="block">
              <span className="text-sm font-medium">
                {cardLike && s.accountType === "credit_card" ? "Credit card ledger" : "Bank ledger"} in Tally{accounts.length > 1 && <span className="font-normal text-muted"> · {k}</span>}
              </span>
              <input
                className={cn(input, "mt-1")}
                value={saved.bankLedgers[k] ?? defaultBankLedger(s)}
                onChange={(e) => update({ bankLedgers: { ...saved.bankLedgers, [k]: e.target.value } })}
              />
            </label>
          ))}
          <label className="block">
            <span className="text-sm font-medium">Default ledger for the other side</span>
            <input className={cn(input, "mt-1")} value={saved.defaultLedger} onChange={(e) => update({ defaultLedger: e.target.value })} />
            <span className="mt-1 block text-xs text-muted">Usually a Suspense ledger you clear later, or map categories below.</span>
          </label>

          <div className="rounded-xl border border-line-strong">
            <button onClick={() => setShowMap((v) => !v)} className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium">
              Map categories to ledgers <span className="text-muted">(optional)</span>
              <ChevronDown className={cn("size-4 text-muted transition", showMap && "rotate-180")} />
            </button>
            {showMap && (
              <div className="grid grid-cols-[1fr_1.4fr] items-center gap-x-3 gap-y-2 border-t border-line px-4 py-3">
                {usedCats.map((c) => (
                  <label key={c} className="contents">
                    <span className="text-sm text-ink-soft">{c}</span>
                    <input
                      className={input}
                      placeholder={saved.defaultLedger || "Suspense"}
                      value={saved.categoryLedgers[c] ?? ""}
                      onChange={(e) => update({ categoryLedgers: { ...saved.categoryLedgers, [c]: e.target.value } })}
                    />
                  </label>
                ))}
                <p className="col-span-2 mt-1 text-xs text-muted">Rows mapped to a ledger named “Cash” become Contra vouchers. Your mapping is saved in this browser.</p>
              </div>
            )}
          </div>

          <div className="rounded-xl bg-white p-4 text-sm">
            <p className="font-medium">These ledgers must already exist in Tally:</p>
            <p className="mt-1 text-ink-soft">{ledgers.join(" · ")}</p>
            <p className="mt-3 text-xs text-muted">
              Then in TallyPrime: Gateway of Tally → Import → Transactions, choose this file (older versions: Import of Data → Vouchers). Try it on a
              backup company first.
            </p>
          </div>

          {flagged > 0 && (
            <p className="flex gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              {flagged} row{flagged > 1 ? "s don’t" : " doesn’t"} tie out to the statement’s balance. Fix {flagged > 1 ? "them" : "it"} in the table before importing.
            </p>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className={btn("ghost", "md")}>Cancel</button>
          <button onClick={download} disabled={count === 0} className={btn("primary", "md")}>
            <Download className="size-4" /> Download Tally XML
          </button>
        </div>
      </div>
    </div>
  );
}
