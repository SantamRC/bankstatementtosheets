/**
 * Generates synthetic bank statements with known answers for `npm run bench`.
 *
 *   npx tsx scripts/make-bench-statements.ts [--out bench/statements]
 *
 * Writes <name>.pdf plus <name>.truth.json (the correct transactions). Every statement is fictional:
 * made-up banks, people and merchants. Layouts copy common real-world patterns (US signed amount, UK paid out/in
 * with one balance per day, Indian Dr/Cr with lakh grouping and wrapped UPI narrations, newest-first, EU decimal
 * comma, credit card, no running balance). Each layout comes as a clean digital PDF and as a "scanned" copy
 * (rasterised, tilted, noisy, no text layer).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import sharp from "sharp";

// ---------- deterministic randomness ----------
let seed = 20261112;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
const pick = <T,>(xs: readonly T[]) => xs[Math.floor(rnd() * xs.length)];
const between = (a: number, b: number) => a + rnd() * (b - a);
const r2 = (n: number) => Math.round(n * 100) / 100;

// ---------- truth ----------
type Tx = { date: string; description: string; debit: number | null; credit: number | null; balance: number };
type Truth = { layout: string; scanned: boolean; currency: string; opening: number; closing: number; transactions: Tx[] };

const MERCHANTS = {
  us: ["WHOLE FOODS MKT #10234", "SHELL OIL 57442", "AMAZON MKTPLACE PMTS", "NETFLIX.COM", "UBER *TRIP", "STARBUCKS STORE 1187", "COSTCO WHSE #0412", "VERIZON WIRELESS PAYMENT", "CON ED OF NY UTIL", "TARGET T-2291", "CVS/PHARMACY #03321", "DELTA AIR 0067", "ZELLE TO J SMITH", "VENMO PAYMENT"],
  usIn: ["DIRECT DEP ACME CORP PAYROLL", "ZELLE FROM M LEE", "MOBILE DEPOSIT", "INTEREST PAYMENT"],
  uk: ["TESCO STORES 2231", "SAINSBURYS S/MKTS", "TFL TRAVEL CH", "COSTA COFFEE", "BRITISH GAS", "THAMES WATER", "AMAZON.CO.UK", "DELIVEROO", "PRET A MANGER", "COUNCIL TAX DD", "SKY DIGITAL"],
  ukIn: ["SALARY NORTHWIND LTD", "FASTER PAYMENT FROM A PATEL", "REFUND AMAZON.CO.UK"],
  in: ["UPI/{r}/Swiggy/swiggy@icici/Payment from Ph", "UPI/{r}/ZOMATO LTD/zomato@hdfcbank/Pay", "POS {r} BIGBASKET BANGALORE", "UPI/{r}/AMAZON PAY/amazonpay@apl/Paymen", "ATW-{r}-SBI ATM KORAMANGALA", "NEFT/{r}/HDFC0001234/LIC OF INDIA", "UPI/{r}/BESCOM/bescom@axis/Electricity", "UPI/{r}/AIRTEL/airtel@paytm/Recharge", "ACH D- {r} TP ACH HDFC LTD EMI", "UPI/{r}/RAPIDO/rapido@ybl/Ride"],
  inIn: ["NEFT/{r}/CITI0000002/ACME SOFTWARE PVT LTD SALARY", "UPI/{r}/RAHUL SHARMA/rahul@okaxis/Rent sh", "IMPS/{r}/SBIN0004567/PRIYA N", "INT.PD:{r}:01-10-2026 TO 31-10-2026"],
  eu: ["REWE Markt GmbH", "Lidl sagt Danke", "Deutsche Bahn", "Stadtwerke Muenchen", "Vodafone GmbH", "Amazon EU S.a.r.l.", "Spotify AB", "Aral Tankstelle", "dm-drogerie markt"],
  euIn: ["Gehalt Northwind GmbH", "Gutschrift M. Mueller", "Erstattung Amazon"],
};

function makeTxs(region: keyof typeof MERCHANTS, n: number, start: Date, days: number, opening: number, scale: number) {
  const incoming = MERCHANTS[(region + "In") as keyof typeof MERCHANTS] ?? [];
  const dates = Array.from({ length: n }, () => Math.floor(rnd() * days)).sort((a, b) => a - b);
  let bal = opening;
  const txs: Tx[] = [];
  for (const d of dates) {
    const date = new Date(start.getTime() + d * 86400e3).toISOString().slice(0, 10);
    const isIn = rnd() < 0.18;
    const amt = r2(isIn ? between(0.4, 2.5) * scale : between(0.004, 0.25) * scale);
    const ref = String(Math.floor(between(1e11, 9e11)));
    const description = pick(isIn ? incoming : MERCHANTS[region]).replace("{r}", ref);
    bal = r2(bal + (isIn ? amt : -amt));
    txs.push({ date, description, debit: isIn ? null : amt, credit: isIn ? amt : null, balance: bal });
  }
  return txs;
}

// ---------- page drawing primitives (rendered to pdf-lib or to SVG for scans) ----------
type Item = { x: number; y: number; text: string; size: number; bold?: boolean; align?: "left" | "right"; mono?: boolean };
type Line = { x1: number; y1: number; x2: number; y2: number };
type Page = { items: Item[]; lines: Line[] };
const W = 612;
const H = 792;

type Col = { title: string; x: number; align?: "left" | "right"; get: (t: Tx) => string | string[] };
type Layout = {
  id: string;
  bank: string;
  region: keyof typeof MERCHANTS;
  currency: string;
  n: number;
  days: number;
  scale: number;
  opening: number;
  newestFirst?: boolean;
  balancePerDay?: boolean; // only the last row of each day shows a balance
  noBalance?: boolean;
  card?: boolean;
  fmtDate: (iso: string) => string;
  fmtNum: (n: number) => string;
  cols: Col[];
};

const usNum = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const inNum = (n: number) => n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const euNum = (n: number) => n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const [y4, mo, dd] = [(s: string) => s.slice(0, 4), (s: string) => s.slice(5, 7), (s: string) => s.slice(8, 10)];
const wrap = (s: string, w: number) => (s.length <= w ? [s] : [s.slice(0, w), s.slice(w, 2 * w)]);

function layouts(): Layout[] {
  const L: Layout[] = [];
  const us = (id: string, n: number, extra: Partial<Layout> = {}): Layout => ({
    id, bank: "Northwind National Bank", region: "us", currency: "USD", n, days: 30, scale: 4000, opening: 5234.17,
    fmtDate: (s) => `${mo(s)}/${dd(s)}`, fmtNum: usNum,
    cols: [
      { title: "Date", x: 40, get: (t) => `${mo(t.date)}/${dd(t.date)}` },
      { title: "Description", x: 95, get: (t) => t.description },
      { title: "Amount", x: 470, align: "right", get: (t) => (t.debit ? `-${usNum(t.debit)}` : usNum(t.credit!)) },
      { title: "Balance", x: 570, align: "right", get: (t) => usNum(t.balance) },
    ],
    ...extra,
  });
  const def = (l: Layout) => L.push(l);
  def(us("us-checking-short", 24));
  def(us("us-checking-long", 140, { days: 90, opening: 12880.4 }));
  def({
    id: "uk-current-balance-per-day", bank: "Harbour & Co Bank", region: "uk", currency: "GBP", n: 70, days: 31, scale: 2500, opening: 1840.55,
    balancePerDay: true, fmtDate: (s) => `${dd(s)} ${MON[+mo(s) - 1]} ${y4(s).slice(2)}`, fmtNum: usNum,
    cols: [
      { title: "Date", x: 40, get: (t) => `${dd(t.date)} ${MON[+mo(t.date) - 1]} ${y4(t.date).slice(2)}` },
      { title: "Payment type and details", x: 105, get: (t) => t.description },
      { title: "Paid out", x: 400, align: "right", get: (t) => (t.debit ? usNum(t.debit) : "") },
      { title: "Paid in", x: 480, align: "right", get: (t) => (t.credit ? usNum(t.credit) : "") },
      { title: "Balance", x: 570, align: "right", get: (t) => usNum(t.balance) },
    ],
  });
  const inCols: Col[] = [
    { title: "Date", x: 30, get: (t) => `${dd(t.date)}/${mo(t.date)}/${y4(t.date).slice(2)}` },
    { title: "Narration", x: 80, get: (t) => wrap(t.description, 34) },
    { title: "Chq./Ref.No.", x: 255, get: (t) => (t.description.match(/\d{12}/)?.[0] ?? "").padStart(16, "0") },
    { title: "Withdrawal Amt.", x: 418, align: "right", get: (t) => (t.debit ? inNum(t.debit) : "") },
    { title: "Deposit Amt.", x: 495, align: "right", get: (t) => (t.credit ? inNum(t.credit) : "") },
    { title: "Closing Balance", x: 582, align: "right", get: (t) => inNum(t.balance) },
  ];
  def({ id: "in-savings-wrapped-upi", bank: "Deccan Commercial Bank", region: "in", currency: "INR", n: 90, days: 31, scale: 60000, opening: 184233.5, fmtDate: (s) => s, fmtNum: inNum, cols: inCols });
  def({
    id: "in-newest-first", bank: "Bharat Union Bank", region: "in", currency: "INR", n: 45, days: 30, scale: 40000, opening: 52310.0, newestFirst: true,
    fmtDate: (s) => s, fmtNum: inNum,
    cols: [
      { title: "Txn Date", x: 30, get: (t) => `${dd(t.date)} ${MON[+mo(t.date) - 1]} ${y4(t.date)}` },
      { title: "Description", x: 100, get: (t) => wrap(t.description, 40) },
      { title: "Debit", x: 430, align: "right", get: (t) => (t.debit ? inNum(t.debit) : "") },
      { title: "Credit", x: 505, align: "right", get: (t) => (t.credit ? inNum(t.credit) : "") },
      { title: "Balance", x: 582, align: "right", get: (t) => `${inNum(t.balance)}CR` },
    ],
  });
  def({
    id: "eu-girokonto-decimal-comma", bank: "Alpenland Sparbank", region: "eu", currency: "EUR", n: 40, days: 31, scale: 3000, opening: 2311.09,
    fmtDate: (s) => s, fmtNum: euNum,
    cols: [
      { title: "Buchung", x: 40, get: (t) => `${dd(t.date)}.${mo(t.date)}.${y4(t.date)}` },
      { title: "Verwendungszweck", x: 115, get: (t) => t.description },
      { title: "Betrag EUR", x: 480, align: "right", get: (t) => (t.debit ? `-${euNum(t.debit)}` : `+${euNum(t.credit!)}`) },
      { title: "Saldo EUR", x: 570, align: "right", get: (t) => euNum(t.balance) },
    ],
  });
  def({
    id: "us-no-running-balance", bank: "Lakeside Credit Union", region: "us", currency: "USD", n: 30, days: 30, scale: 3000, opening: 3100.0, noBalance: true,
    fmtDate: (s) => s, fmtNum: usNum,
    cols: [
      { title: "Posted", x: 40, get: (t) => `${mo(t.date)}/${dd(t.date)}/${y4(t.date)}` },
      { title: "Description", x: 115, get: (t) => t.description },
      { title: "Withdrawals", x: 470, align: "right", get: (t) => (t.debit ? usNum(t.debit) : "") },
      { title: "Deposits", x: 570, align: "right", get: (t) => (t.credit ? usNum(t.credit) : "") },
    ],
  });
  return L;
}

function paginate(l: Layout, txs: Tx[], opening: number, closing: number): Page[] {
  const rows = l.newestFirst ? [...txs].reverse() : txs;
  const pages: Page[] = [];
  let page: Page | null = null;
  let y = 0;
  const lastOfDay = new Set(txs.map((t, i) => (i === txs.length - 1 || txs[i + 1].date !== t.date ? i : -1)).filter((i) => i >= 0));
  const startPage = () => {
    page = { items: [], lines: [] };
    pages.push(page);
    const first = pages.length === 1;
    page.items.push({ x: 40, y: 50, text: l.bank, size: 16, bold: true });
    page.items.push({ x: 572, y: 50, text: `Page ${pages.length}`, size: 8, align: "right" });
    y = 80;
    if (first) {
      const f = l.fmtNum;
      const s = [
        `Account holder: Jordan A. Sample   Account no: XXXX XXXX ${Math.floor(between(1000, 9999))}`,
        `Statement period: ${txs[0].date} to ${txs[txs.length - 1].date}   Currency: ${l.currency}`,
        `Opening balance: ${f(opening)}    Total debits: ${f(r2(txs.reduce((a, t) => a + (t.debit ?? 0), 0)))}    Total credits: ${f(r2(txs.reduce((a, t) => a + (t.credit ?? 0), 0)))}    Closing balance: ${f(closing)}`,
      ];
      for (const t of s) page.items.push({ x: 40, y: (y += 14), text: t, size: 8.5 });
      y += 20;
    }
    for (const c of l.cols) page.items.push({ x: c.x, y, text: c.title, size: 8, bold: true, align: c.align });
    page.lines.push({ x1: 30, y1: y + 4, x2: 585, y2: y + 4 });
    y += 16;
  };
  rows.forEach((t) => {
    const idx = txs.indexOf(t);
    const cells = l.cols.map((c) => {
      let v = c.get(t);
      if (l.balancePerDay && /balance/i.test(c.title) && !lastOfDay.has(idx)) v = "";
      return Array.isArray(v) ? v : [v];
    });
    const h = Math.max(...cells.map((c) => c.length)) * 10 + 4;
    if (!page || y + h > H - 50) startPage();
    cells.forEach((lines, i) => lines.forEach((text, j) => text && page!.items.push({ x: l.cols[i].x, y: y + j * 10, text, size: 7.5, align: l.cols[i].align })));
    y += h;
  });
  return pages;
}

// ---------- renderers ----------
async function toDigitalPdf(pages: Page[]) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  for (const p of pages) {
    const page = pdf.addPage([W, H]);
    for (const it of p.items) {
      const f = it.bold ? bold : font;
      const w = f.widthOfTextAtSize(it.text, it.size);
      page.drawText(it.text, { x: it.align === "right" ? it.x - w : it.x, y: H - it.y, size: it.size, font: f, color: rgb(0.1, 0.1, 0.1) });
    }
    for (const ln of p.lines) page.drawLine({ start: { x: ln.x1, y: H - ln.y1 }, end: { x: ln.x2, y: H - ln.y2 }, thickness: 0.5 });
  }
  return pdf.save();
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
async function toScannedPdf(pages: Page[]) {
  const pdf = await PDFDocument.create();
  const scale = 2; // ~144 dpi
  for (const p of pages) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W * scale}" height="${H * scale}" viewBox="0 0 ${W} ${H}">
      <rect width="100%" height="100%" fill="#f4f2ec"/>
      ${p.lines.map((l) => `<line x1="${l.x1}" y1="${l.y1}" x2="${l.x2}" y2="${l.y2}" stroke="#333" stroke-width="0.5"/>`).join("")}
      ${p.items
        .map((it) => `<text x="${it.x}" y="${it.y}" font-family="Helvetica, Arial" font-size="${it.size}" ${it.bold ? 'font-weight="bold"' : ""} ${it.align === "right" ? 'text-anchor="end"' : ""} fill="#222">${esc(it.text)}</text>`)
        .join("")}
    </svg>`;
    const noise = await sharp({ create: { width: W * scale, height: H * scale, channels: 3, noise: { type: "gaussian", mean: 128, sigma: 22 } } })
      .png()
      .toBuffer();
    const jpg = await sharp(Buffer.from(svg))
      .composite([{ input: noise, blend: "soft-light" }])
      .rotate(between(-0.9, 0.9), { background: "#e9e6de" })
      .blur(0.55)
      .grayscale()
      .jpeg({ quality: 62 })
      .toBuffer();
    const img = await pdf.embedJpg(jpg);
    pdf.addPage([W, H]).drawImage(img, { x: 0, y: 0, width: W, height: H });
  }
  return pdf.save();
}

// ---------- main ----------
async function main() {
  const a = process.argv.slice(2);
  const out = a.includes("--out") ? a[a.indexOf("--out") + 1] : "bench/statements";
  mkdirSync(out, { recursive: true });
  const start = new Date("2026-08-01T00:00:00Z");
  let total = 0;
  for (const l of layouts()) {
    const txs = makeTxs(l.region, l.n, start, l.days, l.opening, l.scale);
    const closing = txs[txs.length - 1].balance;
    const pages = paginate(l, txs, l.opening, closing);
    for (const scanned of [false, true]) {
      const name = `${l.id}${scanned ? "-scan" : ""}`;
      const bytes = scanned ? await toScannedPdf(pages) : await toDigitalPdf(pages);
      writeFileSync(join(out, `${name}.pdf`), bytes);
      const truth: Truth = { layout: l.id, scanned, currency: l.currency, opening: l.opening, closing, transactions: txs };
      writeFileSync(join(out, `${name}.truth.json`), JSON.stringify(truth, null, 2));
      total += pages.length;
      console.log(`${name.padEnd(36)} ${String(pages.length).padStart(2)} pages  ${txs.length} rows`);
    }
  }
  console.log(`\n${total} pages written to ${out}/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
