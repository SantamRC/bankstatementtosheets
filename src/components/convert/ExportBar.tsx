"use client";
import { useState } from "react";
import { Check, ClipboardCopy, Download, FileSpreadsheet, Loader2, Sheet } from "lucide-react";
import type { Statement } from "@/lib/extraction/schema";
import { baseName, categoryTable, summaryTable, toCSV, toTSV, transactionsTable } from "@/lib/export/build";
import { downloadXlsx, saveBlob } from "@/lib/export/xlsx";
import { btn, cn } from "@/lib/ui";
import { useDescStyle } from "@/lib/prefs";
import { DescStyleSwitch } from "./DescStyleSwitch";

type Busy = null | "xlsx" | "csv" | "copy" | "sheets";

export function ExportBar({ statements, scopeLabel }: { statements: Statement[]; scopeLabel: string }) {
  const [busy, setBusy] = useState<Busy>(null);
  const [done, setDone] = useState<Busy>(null);
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
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
    setSheetUrl(j.url);
    window.open(j.url, "_blank", "noopener");
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
      {(error || sheetUrl) && (
        <p className={cn("mt-2 px-2 text-sm", error ? "text-danger" : "text-ink-soft")}>
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
