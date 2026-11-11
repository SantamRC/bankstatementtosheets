/**
 * Model bake-off on real statements.
 *
 *   npm run bench -- --dir bench/statements
 *   npm run bench -- --dir bench/statements --configs cascade,claude-haiku-5-5,claude-opus-5-5 --save
 *
 * Configs: "cascade" (fast model first, strong model only where verification fails) or any single model id.
 * Override the cascade pair with --fast <model> --strong <model>.
 *
 * Measures per config: % of statements fully verified by reconciliation, $/page, latency, escalation rate,
 * and row agreement with a reference config (default: the opus config if present).
 * Results (metrics only — no transaction data unless --save) go to bench/results/.
 *
 * ⚠️ bench/ is git-ignored. Never commit real bank statements.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import {
  FAST_MODEL,
  STRONG_MODEL,
  extractStatement,
  hasAnthropicCredentials,
  inspectPdf,
  type Mode,
} from "../src/lib/extraction/core";
import type { Statement } from "../src/lib/extraction/schema";

type Args = { dir: string; configs: string[]; fast: string; strong: string; save: boolean; yes: boolean; reference?: string };

function parseArgs(): Args {
  const a = process.argv.slice(2);
  const get = (k: string) => {
    const i = a.indexOf(`--${k}`);
    return i >= 0 ? a[i + 1] : undefined;
  };
  return {
    dir: get("dir") ?? "bench/statements",
    configs: (get("configs") ?? `cascade,${FAST_MODEL},${STRONG_MODEL}`).split(",").map((s) => s.trim()).filter(Boolean),
    fast: get("fast") ?? FAST_MODEL,
    strong: get("strong") ?? STRONG_MODEL,
    save: a.includes("--save"),
    yes: a.includes("--yes"),
    reference: get("reference"),
  };
}

// Rough pre-flight estimate only (real cost is measured from token usage).
const EST_PER_PAGE: Record<string, number> = { opus: 0.05, sonnet: 0.025, haiku: 0.002, fable: 0.12 };
const estimate = (config: string) =>
  config === "cascade" ? 0.012 : (Object.entries(EST_PER_PAGE).find(([k]) => config.includes(k))?.[1] ?? 0.05);

interface Row {
  file: string;
  config: string;
  pages: number;
  ok: boolean;
  error?: string;
  status?: string;
  rows?: number;
  verifiedRows?: number;
  mismatchRows?: number;
  difference?: number | null;
  escalated?: string;
  costUsd?: number;
  costPerPage?: number;
  seconds?: number;
  agreement?: number | null;
  /** F1 vs the known answer (<file>.truth.json from scripts/make-bench-statements.ts), when there is one. */
  truth?: number | null;
  /** Every row matched the known answer exactly (count, dates and signed amounts). */
  exact?: boolean | null;
}

/** F1 overlap of (date, signed amount) between two extractions — a proxy for accuracy vs a reference. */
function agreement(a: Statement, b: Statement): number {
  const keys = (s: Statement) => {
    const m = new Map<string, number>();
    for (const t of s.transactions) {
      const k = `${t.date}|${((t.credit ?? 0) - (t.debit ?? 0)).toFixed(2)}`;
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return m;
  };
  const ka = keys(a);
  const kb = keys(b);
  let inter = 0;
  for (const [k, n] of ka) inter += Math.min(n, kb.get(k) ?? 0);
  const total = a.transactions.length + b.transactions.length;
  return total ? (2 * inter) / total : 1;
}

/** Summary columns vs the known answers: mean F1 and share of statements extracted exactly. */
const truthCols = (ok: Row[]): string[] => {
  const t = ok.map((r) => r.truth).filter((x): x is number => x != null);
  const ex = ok.filter((r) => r.exact != null);
  return [
    t.length ? `${Math.round((t.reduce((a, b) => a + b, 0) / t.length) * 1000) / 10}%` : "–",
    ex.length ? pct(ex.filter((r) => r.exact).length, ex.length) : "–",
  ];
};

const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}%` : "–");
const median = (xs: number[]) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

async function main() {
  const args = parseArgs();
  if (!hasAnthropicCredentials()) {
    console.error("No Anthropic credentials: run `ant auth login` once, or set ANTHROPIC_API_KEY in .env.local.");
    process.exit(1);
  }
  let files: string[];
  try {
    files = readdirSync(args.dir).filter((f) => f.toLowerCase().endsWith(".pdf")).map((f) => join(args.dir, f));
  } catch {
    console.error(`No folder at ${args.dir}. Put sample statements (PDF) there.`);
    process.exit(1);
  }
  if (!files.length) {
    console.error(`No PDFs in ${args.dir}.`);
    process.exit(1);
  }

  // Load PDFs once.
  const docs = [];
  for (const f of files) {
    try {
      const { doc, pages } = await inspectPdf(new Uint8Array(readFileSync(f)));
      const tf = f.replace(/\.pdf$/i, ".truth.json");
      const truth = existsSync(tf) ? (JSON.parse(readFileSync(tf, "utf8")) as Pick<Statement, "transactions">) : null;
      docs.push({ file: f, doc, pages, truth });
    } catch (e) {
      console.warn(`skip ${basename(f)}: ${e instanceof Error ? e.message : e}`);
    }
  }
  const totalPages = docs.reduce((n, d) => n + d.pages, 0);
  const est = args.configs.reduce((s, c) => s + estimate(c) * totalPages, 0);
  console.log(`\n${docs.length} statements, ${totalPages} pages × ${args.configs.length} configs: ${args.configs.join(", ")}`);
  console.log(`cascade = ${args.fast} → ${args.strong}`);
  console.log(`Estimated API cost ≈ $${est.toFixed(2)} (rough)\n`);
  if (est > 2 && !args.yes) {
    console.error("Estimated cost is over $2. Re-run with --yes to proceed.");
    process.exit(1);
  }

  const modeFor = (config: string): Mode =>
    config === "cascade" ? { kind: "cascade", fast: args.fast, strong: args.strong } : { kind: "single", model: config };

  const results: Row[] = [];
  const outputs = new Map<string, Statement>(); // `${file}::${config}`
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outDir = join("bench", "results");
  mkdirSync(outDir, { recursive: true });

  for (const d of docs) {
    for (const config of args.configs) {
      const name = basename(d.file);
      process.stdout.write(`  ${name.padEnd(36).slice(0, 36)} ${config.padEnd(20)} `);
      const t0 = Date.now();
      try {
        const s = await extractStatement(name, d.doc, d.pages, { mode: modeFor(config) });
        const m = s.extraction!;
        outputs.set(`${d.file}::${config}`, s);
        const r = s.reconciliation;
        const truthScore = d.truth ? Math.round(agreement(s, d.truth as Statement) * 1000) / 1000 : null;
        results.push({
          file: name,
          config,
          pages: d.pages,
          ok: true,
          status: r.status,
          rows: s.transactions.length,
          verifiedRows: r.verifiedRows + r.fixedRows,
          mismatchRows: r.mismatchRows,
          difference: r.difference,
          escalated: m.mode === "cascade" ? `${m.escalatedChunks.length}/${m.chunks}` : "",
          costUsd: m.costUsd,
          costPerPage: m.costPerPageUsd,
          seconds: (Date.now() - t0) / 1000,
          truth: truthScore,
          exact: d.truth ? truthScore === 1 && s.transactions.length === d.truth.transactions.length : null,
        });
        const tScore = truthScore == null ? "" : `  truth ${(truthScore * 100).toFixed(1)}%`;
        console.log(`${r.status.padEnd(12)} ${String(s.transactions.length).padStart(4)} rows  $${m.costPerPageUsd.toFixed(4)}/pg  ${((Date.now() - t0) / 1000).toFixed(1)}s${tScore}`);
        if (args.save) writeFileSync(join(outDir, `${stamp}__${name}__${config}.json`), JSON.stringify(s, null, 2));
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        results.push({ file: name, config, pages: d.pages, ok: false, error: msg, seconds: (Date.now() - t0) / 1000 });
        console.log(`ERROR ${msg}`);
      }
    }
  }

  // Agreement with reference config.
  const ref = args.reference ?? args.configs.find((c) => c.includes("opus")) ?? args.configs[args.configs.length - 1];
  for (const r of results) {
    const a = outputs.get(`${join(args.dir, r.file)}::${r.config}`);
    const b = outputs.get(`${join(args.dir, r.file)}::${ref}`);
    r.agreement = a && b ? Math.round(agreement(a, b) * 1000) / 1000 : null;
  }

  // Summary per config.
  console.log(`\nSummary (row agreement measured against "${ref}")\n`);
  const header = ["config", "verified", "verified+partial", "needs review", "errors", "avg $/page", "total $", "median s", "escalation", "agreement", "vs truth", "exact"];
  const lines: string[][] = [header];
  for (const config of args.configs) {
    const rs = results.filter((r) => r.config === config);
    const ok = rs.filter((r) => r.ok);
    const pages = ok.reduce((n, r) => n + r.pages, 0);
    const cost = ok.reduce((n, r) => n + (r.costUsd ?? 0), 0);
    const esc = ok.filter((r) => r.escalated && !r.escalated.startsWith("0/")).length;
    const agree = ok.map((r) => r.agreement).filter((x): x is number => x != null);
    lines.push([
      config,
      pct(ok.filter((r) => r.status === "verified").length, rs.length),
      pct(ok.filter((r) => r.status === "verified" || r.status === "partial").length, rs.length),
      String(ok.filter((r) => r.status === "mismatch" || r.status === "no_balances").length),
      String(rs.length - ok.length),
      pages ? `$${(cost / pages).toFixed(4)}` : "–",
      `$${cost.toFixed(3)}`,
      median(ok.map((r) => r.seconds ?? 0)).toFixed(1),
      config === "cascade" ? pct(esc, ok.length) : "–",
      agree.length ? `${Math.round((agree.reduce((a, b) => a + b, 0) / agree.length) * 1000) / 10}%` : "–",
      ...truthCols(ok),
    ]);
  }
  const widths = header.map((_, i) => Math.max(...lines.map((l) => l[i].length)));
  for (const l of lines) console.log("  " + l.map((c, i) => c.padEnd(widths[i])).join("  "));

  const csv = [Object.keys(results[0] ?? { file: "" }).join(",")]
    .concat(results.map((r) => Object.values(r).map((v) => JSON.stringify(v ?? "")).join(",")))
    .join("\n");
  writeFileSync(join(outDir, `${stamp}.csv`), csv);
  writeFileSync(join(outDir, `${stamp}.json`), JSON.stringify({ args, results }, null, 2));
  console.log(`\nSaved bench/results/${stamp}.csv and .json`);
  console.log(`Note: "verified" = the extraction ties out with the statement's own balances. It doesn't check descriptions/dates — spot-check a few with --save.\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
