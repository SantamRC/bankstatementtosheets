"use client";
import { useState } from "react";
import { BookOpen, Check, ChevronDown, ClipboardCopy, Download, FileSpreadsheet, Landmark, Loader2, Sheet, X } from "lucide-react";
import type { Statement } from "@/lib/extraction/schema";
import { baseName, categoryTable, summaryTable, toCSV, toTSV, transactionsTable } from "@/lib/export/build";
import { downloadXlsx, saveBlob } from "@/lib/export/xlsx";
import { toOfxFiles, type OfxFlavor } from "@/lib/export/ofx";
import { btn, cn } from "@/lib/ui";
import { useDescStyle } from "@/lib/prefs";
import { DescStyleSwitch } from "./DescStyleSwitch";
import { TallyDialog } from "./TallyDialog";

type Busy = null | "xlsx" | "csv" | "copy" | "sheets" | "ofx";

const OFX_HELP: Record<OfxFlavor, string> = {
  qbo: "In QuickBooks Online: Transactions → Bank transactions → Upload transactions → pick the .qbo file and the account. QuickBooks Desktop: File → Utilities → Import → Web Connect Files.",
  ofx: "In Xero: Bank account → Manage account → Import a statement → pick the .ofx file. Quicken, Sage, MoneyWiz and most money apps import OFX the same way.",
};

export function ExportBar({ statements, scopeLabel }: { statements: Statement[]; scopeLabel: string }) {
  const [busy, setBusy] = useState<Busy>(null);
  const [done, setDone] = useState<Busy>(null);
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tally, setTally] = useState(false);
  const [ofxMenu, setOfxMenu] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const style = useDescStyle();

  const flash = (k: Busy) => {
    setDone(k);
    setTimeout(() => setDone(null), 2200);
  };

  async function run(kind: Exclude<Busy, null>, fn: () => Promise<void> | void) {
    setBusy(kind);
    setError(null);
    try {
      await fn();
      flash(kind);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setBusy(null);
    }
  }

  const connectGoogle = () =>
    new Promise<boolean>((resolve) => {
      const w = window.open("/api/google/connect", "bsts-google", "width=520,height=680");
      if (!w) return resolve(false);
      const onMsg = (e: MessageEvent) => {
        if (e.origin !== location.origin || e.data?.type !== "bsts-google") return;
        window.removeEventListener("message", onMsg);
        clearInterval(timer);
        resolve(Boolean(e.data.ok));
      };
      const timer = setInterval(() => {
        if (w.closed) {
          clearInterval(timer);
          window.removeEventListener("message", onMsg);
          resolve(false);
        }
      }, 800);
      window.addEventListener("message", onMsg);
    });

  async function toSheets() {
    const payload = JSON.stringify({
      title: baseName(statements),
      sheets: [transactionsTable(statements, style), summaryTable(statements), categoryTable(statements)],
    });
    const post = () => fetch("/api/google/sheets", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload });
    let res = await post();
    if (res.status === 401) {
      const ok = await connectGoogle();
      if (!ok) throw new Error("Google wasn't connected.");
      res = await post();
    }
    const j = await res.json();
    if (!res.ok || !j.url) throw new Error(j.error ?? "Couldn't create the Google Sheet.");
    setNotice(null);
    setSheetUrl(j.url);
    window.open(j.url, "_blank", "noopener");
  }

  async function toOfx(flavor: OfxFlavor) {
    setOfxMenu(false);
    const files = toOfxFiles(statements, { flavor, style });
    if (!files.some((f) => f.transactions > 0)) throw new Error("No transactions to export.");
    for (const [i, f] of files.entries()) {
      if (i) await new Promise((r) => setTimeout(r, 400)); // browsers drop rapid back-to-back downloads
      saveBlob(new Blob([f.content], { type: "application/x-ofx" }), f.filename);
    }
    setSheetUrl(null);
    setNotice(`${files.length > 1 ? `${files.length} files, one per account. ` : ""}${OFX_HELP[flavor]}`);
  }

  const label = (k: Exclude<Busy, null>, text: string) =>
    busy === k ? <Loader2 className="size-4 animate-spin" /> : done === k ? <Check className="size-4" /> : text;

  return (
    <div className="sticky bottom-4 z-20 mt-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-ink/10 bg-ink p-3 text-paper shadow-2xl sm:flex-row sm:items-center">
        <div className="px-2 text-sm">
          <p className="font-semibold">Export {scopeLabel}</p>
          <p className="text-xs text-paper/55">Transactions · Summary · Category totals</p>
          <DescStyleSwitch tone="dark" className="mt-2" />
        </div>
        <div className="flex flex-wrap gap-2 sm:ml-auto">
          <button
            onClick={() => run("xlsx", () => downloadXlsx(statements, style))}
            disabled={busy !== null}
            className={btn("lime", "md", "min-w-[150px]")}
          >
            <FileSpreadsheet className="size-4" /> {label("xlsx", "Download Excel")}
          </button>
          <button
            onClick={() => run("sheets", toSheets)}
            disabled={busy !== null}
            className={cn(btn("outline", "md"), "border-white/15 bg-white/10 text-paper hover:border-white/40")}
          >
            <Sheet className="size-4" /> {label("sheets", "Google Sheets")}
          </button>
          <button
            onClick={() =>
              run("csv", () =>
                saveBlob(new Blob([toCSV(transactionsTable(statements, style))], { type: "text/csv;charset=utf-8" }), `${baseName(statements)}.csv`),
              )
            }
            disabled={busy !== null}
            className={cn(btn("ghost", "md"), "text-paper/80 hover:bg-white/10 hover:text-paper")}
          >
            <Download className="size-4" /> {label("csv", "CSV")}
          </button>
          <div className="relative">
            <button
              onClick={() => setOfxMenu((v) => !v)}
              disabled={busy !== null}
              aria-expanded={ofxMenu}
              title="QuickBooks, Xero, Quicken or Tally import files"
              className={cn(btn("ghost", "md"), "text-paper/80 hover:bg-white/10 hover:text-paper")}
            >
              <Landmark className="size-4" /> {label("ofx", "Accounting")} <ChevronDown className="size-3.5 opacity-60" />
            </button>
            {ofxMenu && (
              <div className="absolute bottom-full right-0 mb-2 w-64 overflow-hidden rounded-xl border border-line-strong bg-card text-ink shadow-xl">
                {(
                  [
                    ["qbo", "QuickBooks (.qbo)", "QuickBooks Online & Desktop"],
                    ["ofx", "OFX (.ofx)", "Xero, Quicken, Sage and others"],
                  ] as const
                ).map(([k, title, sub]) => (
                  <button
                    key={k}
                    onClick={() => run("ofx", () => toOfx(k))}
                    className="block w-full px-4 py-2.5 text-left hover:bg-paper"
                  >
                    <span className="block text-sm font-medium">{title}</span>
                    <span className="block text-xs text-muted">{sub}</span>
                  </button>
                ))}
                <button
                  onClick={() => {
                    setOfxMenu(false);
                    setTally(true);
                  }}
                  className="flex w-full items-start gap-2 border-t border-line px-4 py-2.5 text-left hover:bg-paper"
                >
                  <BookOpen className="mt-0.5 size-4 text-muted" />
                  <span>
                    <span className="block text-sm font-medium">Tally XML</span>
                    <span className="block text-xs text-muted">TallyPrime / Tally.ERP 9 vouchers</span>
                  </span>
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => run("copy", () => navigator.clipboard.writeText(toTSV(transactionsTable(statements, style))))}
            disabled={busy !== null}
            title="Copy as a table you can paste into any spreadsheet"
            className={cn(btn("ghost", "md"), "text-paper/80 hover:bg-white/10 hover:text-paper")}
          >
            <ClipboardCopy className="size-4" /> {label("copy", "Copy")}
          </button>
        </div>
      </div>
      {tally && <TallyDialog statements={statements} style={style} onClose={() => setTally(false)} />}
      {notice && !error && (
        <div className="mt-2 flex items-start gap-3 rounded-xl border border-line-strong bg-card px-4 py-3 text-sm text-ink-soft shadow-lg">
          <Check className="mt-0.5 size-4 shrink-0 text-brand" />
          <p className="flex-1">{notice}</p>
          <button onClick={() => setNotice(null)} aria-label="Dismiss" className="text-muted hover:text-ink">
            <X className="size-4" />
          </button>
        </div>
      )}
      {(error || sheetUrl) && (
        <p className={cn("mt-2 rounded-xl border border-line-strong bg-card px-4 py-3 text-sm shadow-lg", error ? "text-danger" : "text-ink-soft")}>
          {error ?? (
            <>
              Google Sheet created —{" "}
              <a href={sheetUrl!} target="_blank" rel="noreferrer" className="font-medium text-brand underline">
                open it
              </a>
            </>
          )}
        </p>
      )}
    </div>
  );
}
