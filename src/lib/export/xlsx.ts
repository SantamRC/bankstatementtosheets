"use client";
import type { Statement } from "@/lib/extraction/schema";
import { baseName, summaryTable, transactionsTable, type Table } from "./build";
import { CATEGORIES } from "@/lib/extraction/schema";

const MONEY = '#,##0.00;[Red]-#,##0.00';
const BRAND = "FF0F766E";

function isoToDate(v: string): Date | string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : v;
}

/** Builds a polished workbook in the browser (exceljs is lazy-loaded, ~1MB). */
export async function downloadXlsx(statements: Statement[]) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "BankStatementToSheets.com";
  wb.created = new Date();

  const addTable = (t: Table, widths: number[]) => {
    const ws = wb.addWorksheet(t.name, { views: [{ state: "frozen", ySplit: 1 }] });
    t.rows.forEach((r, i) => {
      const row = ws.addRow(
        r.map((v, ci) => (i > 0 && t.dateCols.includes(ci) && typeof v === "string" ? isoToDate(v) : v)),
      );
      if (i === 0) {
        row.font = { bold: true, color: { argb: "FFFFFFFF" } };
        row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND } };
        row.height = 20;
      }
    });
    ws.columns.forEach((col, ci) => {
      col.width = widths[ci] ?? 14;
      if (t.moneyCols.includes(ci)) col.numFmt = MONEY;
      if (t.dateCols.includes(ci)) col.numFmt = "yyyy-mm-dd";
    });
    ws.getRow(1).numFmt = "@";
    if (t.rows.length > 1) ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: t.rows.length, column: t.rows[0].length } };
    return ws;
  };

  const tx = transactionsTable(statements);
  const txWs = addTable(tx, [12, 54, 16, 18, 13, 13, 13, 14, 6, 11, 36]);
  // Highlight rows that need review.
  tx.rows.forEach((r, i) => {
    if (i > 0 && r[9] === "Check")
      txWs.getRow(i + 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF4E5" } };
  });

  addTable(summaryTable(statements), [32, 22, 12, 10, 12, 12, 16, 16, 16, 16, 13, 30]);

  // Category sheet uses live SUMIFS formulas so it updates when users recategorize rows.
  const cat = wb.addWorksheet("Categories", { views: [{ state: "frozen", ySplit: 1 }] });
  const head = cat.addRow(["Category", "Transactions", "Money out", "Money in", "Net"]);
  head.font = { bold: true, color: { argb: "FFFFFFFF" } };
  head.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND } };
  const last = tx.rows.length;
  const used = new Set(statements.flatMap((s) => s.transactions.map((t) => t.category)));
  for (const c of CATEGORIES.filter((c) => used.has(c))) {
    const r = cat.rowCount + 1;
    cat.addRow([
      c,
      { formula: `COUNTIF(Transactions!$D$2:$D$${last},A${r})` },
      { formula: `SUMIFS(Transactions!$E$2:$E$${last},Transactions!$D$2:$D$${last},A${r})` },
      { formula: `SUMIFS(Transactions!$F$2:$F$${last},Transactions!$D$2:$D$${last},A${r})` },
      { formula: `D${r}-C${r}` },
    ]);
  }
  const totalRow = cat.rowCount + 1;
  const t = cat.addRow([
    "Total",
    { formula: `SUM(B2:B${totalRow - 1})` },
    { formula: `SUM(C2:C${totalRow - 1})` },
    { formula: `SUM(D2:D${totalRow - 1})` },
    { formula: `SUM(E2:E${totalRow - 1})` },
  ]);
  t.font = { bold: true };
  cat.columns.forEach((col, i) => {
    col.width = [22, 14, 16, 16, 16][i];
    if (i >= 2) col.numFmt = MONEY;
  });

  const buf = await wb.xlsx.writeBuffer();
  saveBlob(
    new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    `${baseName(statements)}.xlsx`,
  );
}

export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.replace(/[\\/:*?"<>|]+/g, "-");
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
