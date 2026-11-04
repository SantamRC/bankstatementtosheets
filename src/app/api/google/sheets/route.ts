import { NextRequest, NextResponse } from "next/server";
import { getAccessToken } from "@/lib/google";
import { isGoogleConfigured } from "@/lib/env";

type Cell = string | number | null;
interface SheetInput {
  name: string;
  rows: Cell[][];
  /** zero-based column indexes that hold money values */
  moneyCols?: number[];
  dateCols?: number[];
}

/** ISO date -> Sheets serial number (locale-independent, unlike DATEVALUE). */
const serial = (iso: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? (Date.UTC(+m[1], +m[2] - 1, +m[3]) - Date.UTC(1899, 11, 30)) / 86_400_000 : null;
};

const cell = (v: Cell, header: boolean, money: boolean, date: boolean) => {
  if (v == null || v === "") return {};
  const asDate = date && !header && typeof v === "string" ? serial(v) : null;
  const userEnteredValue =
    typeof v === "number" ? { numberValue: v } : asDate != null ? { numberValue: asDate } : { stringValue: v };
  const fmt = header
    ? { textFormat: { bold: true }, backgroundColor: { red: 0.93, green: 0.97, blue: 0.95 } }
    : money
      ? { numberFormat: { type: "NUMBER", pattern: "#,##0.00;[Red]-#,##0.00" } }
      : date
        ? { numberFormat: { type: "DATE", pattern: "yyyy-mm-dd" } }
        : undefined;
  return { userEnteredValue, ...(fmt ? { userEnteredFormat: fmt } : {}) };
};

export async function POST(req: NextRequest) {
  if (!isGoogleConfigured) return NextResponse.json({ error: "Google export isn't configured." }, { status: 503 });
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ needsAuth: true }, { status: 401 });

  const { title, sheets } = (await req.json()) as { title: string; sheets: SheetInput[] };
  if (!Array.isArray(sheets) || sheets.length === 0) return NextResponse.json({ error: "Nothing to export" }, { status: 400 });

  const body = {
    properties: { title: String(title).slice(0, 200) },
    sheets: sheets.map((s, idx) => ({
      properties: { sheetId: idx, title: s.name.slice(0, 90), gridProperties: { frozenRowCount: 1 } },
      data: [
        {
          startRow: 0,
          startColumn: 0,
          rowData: s.rows.map((r, ri) => ({
            values: r.map((v, ci) => cell(v, ri === 0, !!s.moneyCols?.includes(ci), !!s.dateCols?.includes(ci))),
          })),
        },
      ],
    })),
  };

  const res = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.status === 401 || res.status === 403) return NextResponse.json({ needsAuth: true }, { status: 401 });
  if (!res.ok) return NextResponse.json({ error: "Google Sheets rejected the export." }, { status: 502 });
  const created = (await res.json()) as { spreadsheetId: string; spreadsheetUrl: string };

  // Auto-size columns and add filters (best-effort).
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${created.spreadsheetId}:batchUpdate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      requests: sheets.flatMap((s, idx) => [
        { autoResizeDimensions: { dimensions: { sheetId: idx, dimension: "COLUMNS", startIndex: 0, endIndex: s.rows[0]?.length ?? 1 } } },
        { setBasicFilter: { filter: { range: { sheetId: idx, startRowIndex: 0, endRowIndex: s.rows.length } } } },
      ]),
    }),
  }).catch(() => null);

  return NextResponse.json({ url: created.spreadsheetUrl });
}
