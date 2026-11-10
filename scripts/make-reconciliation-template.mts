/**
 * Builds public/templates/bank-reconciliation-template.xlsx (free download on /bank-reconciliation-template-excel).
 * Run: npx tsx scripts/make-reconciliation-template.mts   (commit the generated file)
 */
import ExcelJS from "exceljs";
import { mkdirSync } from "node:fs";

const OUT = "public/templates/bank-reconciliation-template.xlsx";
const BRAND = "FF0B6E4F";
const SOFT = "FFE7F2EC";
const INPUT = "FFFFF8DC";
const MONEY = "#,##0.00";
const ROWS = 200;

const TYPES = [
  "Deposit in transit",
  "Outstanding check / payment",
  "Bank error",
  "Bank credit not in books",
  "Bank charge not in books",
  "Book error",
] as const;

const wb = new ExcelJS.Workbook();
wb.creator = "BankStatementToSheets.com";
wb.created = new Date(Date.UTC(2026, 10, 11));
wb.calcProperties.fullCalcOnLoad = true; // no cached values are written; make every app compute on open

const header = (row: ExcelJS.Row) => {
  row.font = { bold: true, color: { argb: "FFFFFFFF" } };
  row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND } };
  row.height = 20;
};
const input = (c: ExcelJS.Cell) => {
  c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: INPUT } };
  c.border = { bottom: { style: "thin", color: { argb: "FFB8B29A" } } };
};

/* ---------------- Reconciliation ---------------- */
const rec = wb.addWorksheet("Reconciliation", { views: [{ showGridLines: false }] });
rec.columns = [{ width: 4 }, { width: 52 }, { width: 18 }, { width: 22 }];
rec.getCell("B1").value = "Bank reconciliation";
rec.getCell("B1").font = { bold: true, size: 18 };
rec.getCell("B2").value = "Yellow cells are inputs. Everything else is calculated. Example figures are filled in: replace them with yours.";
rec.getCell("B2").font = { italic: true, color: { argb: "FF6B6F69" } };

const label = (r: number, text: string, opts: { bold?: boolean; indent?: boolean } = {}) => {
  const c = rec.getCell(`B${r}`);
  c.value = text;
  c.font = { bold: opts.bold };
  if (opts.indent) c.alignment = { indent: 1 };
};
const money = (r: number, v: ExcelJS.CellValue, opts: { input?: boolean; total?: boolean } = {}) => {
  const c = rec.getCell(`C${r}`);
  c.value = v;
  c.numFmt = MONEY;
  if (opts.input) input(c);
  if (opts.total) {
    c.font = { bold: true };
    c.border = { top: { style: "thin" }, bottom: { style: "double" } };
  }
};
const sumType = (t: string) => ({ formula: `SUMIFS(Adjustments!$E$2:$E$${ROWS + 1},Adjustments!$D$2:$D$${ROWS + 1},"${t}")` });

label(4, "Account");
rec.getCell("C4").value = "Business checking ••4821";
input(rec.getCell("C4"));
rec.mergeCells("C4:D4");
label(5, "Statement end date");
rec.getCell("C5").value = new Date(Date.UTC(2026, 9, 31));
rec.getCell("C5").numFmt = "yyyy-mm-dd";
input(rec.getCell("C5"));

const section = (r: number, text: string) => {
  const c = rec.getCell(`B${r}`);
  c.value = text;
  c.font = { bold: true, color: { argb: BRAND } };
  rec.getRow(r).height = 22;
  for (const col of ["B", "C", "D"]) rec.getCell(`${col}${r}`).border = { bottom: { style: "thin", color: { argb: BRAND } } };
};

section(7, "Bank side");
label(8, "Ending balance per bank statement");
money(8, 5240.18, { input: true });
label(9, "Add: deposits in transit", { indent: true });
money(9, sumType(TYPES[0]));
label(10, "Less: outstanding checks / payments", { indent: true });
money(10, sumType(TYPES[1]));
label(11, "Add / (less): bank errors", { indent: true });
money(11, sumType(TYPES[2]));
label(12, "Adjusted bank balance", { bold: true });
money(12, { formula: "C8+C9-C10+C11" }, { total: true });

section(14, "Book side");
label(15, "Ending cash balance per books (general ledger)");
money(15, 5620.18, { input: true });
label(16, "Add: interest and deposits on the statement, not yet in books", { indent: true });
money(16, sumType(TYPES[3]));
label(17, "Less: bank fees, NSF and charges not yet in books", { indent: true });
money(17, sumType(TYPES[4]));
label(18, "Add / (less): book errors", { indent: true });
money(18, sumType(TYPES[5]));
label(19, "Adjusted book balance", { bold: true });
money(19, { formula: "C15+C16-C17+C18" }, { total: true });

label(21, "Difference (must be 0.00)", { bold: true });
money(21, { formula: "ROUND(C12-C19,2)" });
rec.getCell("C21").font = { bold: true };
rec.getCell("D21").value = { formula: 'IF(C21=0,"✓ Reconciled","✗ Investigate")' };
rec.getCell("D21").font = { bold: true };
rec.addConditionalFormatting({
  ref: "C21:D21",
  rules: [
    { type: "expression", formulae: ["$C$21=0"], priority: 1, style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: SOFT } }, font: { color: { argb: BRAND }, bold: true } } },
    { type: "expression", formulae: ["$C$21<>0"], priority: 2, style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: "FFFDECEA" } }, font: { color: { argb: "FFC0392B" }, bold: true } } },
  ],
});

rec.getCell("B23").value = "List each reconciling item on the Adjustments sheet. Use the Match sheet to find them.";
rec.getCell("B23").font = { italic: true, color: { argb: "FF6B6F69" } };
rec.getCell("B24").value = { text: "Get the statement side as a spreadsheet from any PDF: bankstatementtosheets.com", hyperlink: "https://bankstatementtosheets.com/convert?utm_source=template" };
rec.getCell("B24").font = { color: { argb: BRAND }, underline: true };

/* ---------------- Adjustments ---------------- */
const adj = wb.addWorksheet("Adjustments", { views: [{ state: "frozen", ySplit: 1 }] });
adj.columns = [{ width: 12 }, { width: 44 }, { width: 16 }, { width: 30 }, { width: 14 }];
header(adj.addRow(["Date", "Description", "Reference", "Type", "Amount"]));
const examples: [Date, string, string, string, number][] = [
  [new Date(Date.UTC(2026, 9, 31)), "Customer deposit — Harbour Studio", "DEP-1031", TYPES[0], 1200],
  [new Date(Date.UTC(2026, 9, 29)), "Check #1042 — Office Supply Co.", "1042", TYPES[1], 845.5],
  [new Date(Date.UTC(2026, 9, 30)), "Monthly service fee", "", TYPES[4], 12],
  [new Date(Date.UTC(2026, 9, 30)), "Card processing fees", "", TYPES[4], 13.5],
];
for (const e of examples) adj.addRow(e);
for (let r = 2; r <= ROWS + 1; r++) {
  adj.getCell(`A${r}`).numFmt = "yyyy-mm-dd";
  adj.getCell(`E${r}`).numFmt = MONEY;
  adj.getCell(`D${r}`).dataValidation = {
    type: "list",
    allowBlank: true,
    formulae: [`"${TYPES.join(",")}"`],
    showErrorMessage: true,
    errorTitle: "Pick a type",
    error: "Choose one of the listed types so the reconciliation can total it.",
  };
}
adj.getCell("G1").value = "Amounts are positive. The Type decides whether an item is added or subtracted.";
adj.getCell("G2").value = "Bank errors and book errors: enter a negative amount to subtract.";
for (const c of ["G1", "G2"]) adj.getCell(c).font = { italic: true, color: { argb: "FF6B6F69" } };

/* ---------------- Match ---------------- */
const match = wb.addWorksheet("Match", { views: [{ state: "frozen", ySplit: 2 }] });
match.columns = [{ width: 12 }, { width: 40 }, { width: 14 }, { width: 16 }, { width: 3 }, { width: 12 }, { width: 40 }, { width: 14 }, { width: 16 }];
match.mergeCells("A1:D1");
match.mergeCells("F1:I1");
match.getCell("A1").value = "Bank statement (paste: Date, Description, Amount)";
match.getCell("F1").value = "Books / cash ledger (paste: Date, Description, Amount)";
for (const c of ["A1", "F1"]) {
  match.getCell(c).font = { bold: true, color: { argb: BRAND } };
}
header(match.getRow(2));
match.getRow(2).values = ["Date", "Description", "Amount", "In books?", "", "Date", "Description", "Amount", "On statement?"];
match.getCell("E2").fill = { type: "pattern", pattern: "none" };
for (let r = 3; r <= ROWS + 2; r++) {
  for (const c of ["A", "F"]) match.getCell(`${c}${r}`).numFmt = "yyyy-mm-dd";
  for (const c of ["C", "H"]) match.getCell(`${c}${r}`).numFmt = MONEY;
  // Amount-only match: dates differ between bank and books (checks clear days later).
  match.getCell(`D${r}`).value = { formula: `IF(C${r}="","",IF(COUNTIF($H$3:$H$${ROWS + 2},C${r})>0,"✓","Not in books"))` };
  match.getCell(`I${r}`).value = { formula: `IF(H${r}="","",IF(COUNTIF($C$3:$C$${ROWS + 2},H${r})>0,"✓","Not on statement"))` };
}
for (const col of ["D", "I"])
  match.addConditionalFormatting({
    ref: `${col}3:${col}${ROWS + 2}`,
    rules: [{ type: "containsText", operator: "containsText", text: "Not", priority: 1, style: { font: { color: { argb: "FFC0392B" }, bold: true } } }],
  });

/* ---------------- How to use ---------------- */
const how = wb.addWorksheet("How to use", { views: [{ showGridLines: false }] });
how.columns = [{ width: 4 }, { width: 110 }];
const steps = [
  "How to use this bank reconciliation template",
  "",
  "1. Get the bank side as a spreadsheet. Convert the PDF statement (bankstatementtosheets.com does this and checks every row against the statement's balances), or download your bank's activity export.",
  "2. Export the cash account from your books (QuickBooks, Xero, Tally or your own ledger) for the same period.",
  "3. Paste both into the Match sheet: Date, Description and Amount (money in positive, money out negative, the same sign rule on both sides).",
  "4. Rows marked 'Not in books' are usually bank fees, interest or deposits you haven't recorded. Rows marked 'Not on statement' are usually deposits in transit or outstanding checks.",
  "5. List each of those on the Adjustments sheet and pick its Type from the dropdown.",
  "6. On the Reconciliation sheet, type the statement's ending balance and your books' ending balance. The difference must be 0.00.",
  "7. Record the 'not in books' items in your accounting system, then file the reconciliation with the statement.",
  "",
  "Tips",
  "• Matching is by amount. Two items with the same amount can hide each other: check them by hand.",
  "• A difference equal to twice an amount usually means a sign was flipped; a difference divisible by 9 often means two digits were transposed.",
  "• Free template from BankStatementToSheets.com. Use, copy and share it freely.",
];
steps.forEach((t, i) => {
  const c = how.getCell(`B${i + 1}`);
  c.value = t;
  c.alignment = { wrapText: true, vertical: "top" };
  if (i === 0) c.font = { bold: true, size: 16 };
  if (t === "Tips") c.font = { bold: true, color: { argb: BRAND } };
});

mkdirSync("public/templates", { recursive: true });
await wb.xlsx.writeFile(OUT);
console.log(`wrote ${OUT}`);
