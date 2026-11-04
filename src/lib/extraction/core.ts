/**
 * Extraction engine — framework-free so it runs inside Next.js (via extract.ts) and from the CLI benchmark.
 *
 * Cascade strategy ("verify, then escalate"):
 *   1. Every chunk (5 pages) goes to the FAST model.
 *   2. The statement is reconciled against its own printed balances.
 *   3. Only chunks containing rows that don't tie out (or everything, if nothing can be verified) are re-run on the
 *      STRONG model. The better of the two results is returned.
 * Reconciliation is what makes this safe: we only pay strong-model prices where the cheap model was provably wrong.
 */
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { PDFDocument } from "pdf-lib";
import {
  ModelChunkSchema,
  type ExtractionMeta,
  type ModelCall,
  type ModelChunk,
  type Statement,
  type Transaction,
} from "./schema";
import { reconcile } from "./reconcile";
import { SYSTEM_PROMPT, chunkInstructions } from "./prompt";

/* ---------------- Config ---------------- */

export type Effort = "low" | "medium" | "high";
export type Mode = { kind: "cascade"; fast: string; strong: string } | { kind: "single"; model: string };

export const FAST_MODEL = process.env.EXTRACTION_MODEL_FAST || "claude-haiku-5-5";
export const STRONG_MODEL = process.env.EXTRACTION_MODEL_STRONG || process.env.EXTRACTION_MODEL || "claude-opus-5-5";
const EFFORT = (process.env.EXTRACTION_EFFORT || "medium") as Effort;
const PAGES_PER_CHUNK = Number(process.env.EXTRACTION_PAGES_PER_CHUNK || 5);
const CONCURRENCY = Number(process.env.EXTRACTION_CONCURRENCY || 4);

export function defaultMode(): Mode {
  return (process.env.EXTRACTION_MODE || "cascade") === "single"
    ? { kind: "single", model: STRONG_MODEL }
    : { kind: "cascade", fast: FAST_MODEL, strong: STRONG_MODEL };
}

/** USD per million tokens (input, output). Thinking tokens bill as output. Keep in sync with Anthropic pricing. */
const PRICES: Record<string, { in: number; out: number }> = {
  "claude-fable-5-1": { in: 10, out: 50 },
  "claude-opus-5-5": { in: 4, out: 20 },
  "claude-opus-5": { in: 5, out: 25 },
  "claude-sonnet-5-5": { in: 2, out: 10 },
  "claude-sonnet-5": { in: 2, out: 10 },
  "claude-haiku-5-5": { in: 0.1, out: 0.5 }, // prompts ≤100K tokens; our chunks are far below that
};

export function costOf(model: string, inputTokens: number, outputTokens: number): number {
  const p = PRICES[model] ?? Object.entries(PRICES).find(([k]) => model.startsWith(k))?.[1];
  if (!p) return 0;
  return (inputTokens * p.in + outputTokens * p.out) / 1_000_000;
}

/* ---------------- Errors ---------------- */

export class ExtractionError extends Error {
  constructor(
    public code: "encrypted" | "invalid_pdf" | "not_statement" | "model_refused" | "model_failed" | "too_long",
    message: string,
  ) {
    super(message);
  }
}

/* ---------------- PDF helpers ---------------- */

/** Load a PDF and count pages. Throws ExtractionError for encrypted/corrupt files. */
export async function inspectPdf(bytes: Uint8Array): Promise<{ doc: PDFDocument; pages: number }> {
  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(bytes, { updateMetadata: false });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (/encrypt/i.test(msg))
      throw new ExtractionError(
        "encrypted",
        "This PDF is password-protected. Open it, print/save it as a new PDF without a password, then upload again.",
      );
    throw new ExtractionError("invalid_pdf", "We couldn't read this file as a PDF. Is it corrupted?");
  }
  return { doc, pages: doc.getPageCount() };
}

export interface Chunk {
  b64: string;
  from: number;
  to: number;
}

async function splitPdf(doc: PDFDocument, pages: number): Promise<Chunk[]> {
  if (pages <= PAGES_PER_CHUNK + 1) {
    const bytes = await doc.save();
    return [{ b64: Buffer.from(bytes).toString("base64"), from: 1, to: pages }];
  }
  const chunks: Chunk[] = [];
  for (let start = 0; start < pages; start += PAGES_PER_CHUNK) {
    const end = Math.min(start + PAGES_PER_CHUNK, pages);
    const part = await PDFDocument.create();
    const copied = await part.copyPages(
      doc,
      Array.from({ length: end - start }, (_, i) => start + i),
    );
    copied.forEach((p) => part.addPage(p));
    chunks.push({ b64: Buffer.from(await part.save()).toString("base64"), from: start + 1, to: end });
  }
  return chunks;
}

/* ---------------- Model call ---------------- */

let client: Anthropic | null = null;
const anthropic = () => (client ??= new Anthropic({ maxRetries: 3 }));

// Server-side refusal fallbacks ("default" form) are supported on these models; Haiku has none.
const supportsFallbacks = (model: string) => /^claude-(opus-5|sonnet-5-5|fable-5)/.test(model);

export interface ChunkResult {
  chunk: ModelChunk;
  call: ModelCall;
}

/** Pluggable model call: swap in another provider (Gemini, OpenAI) or a fake for tests. */
export type ChunkExtractor = (model: string, chunk: Chunk, totalPages: number) => Promise<ChunkResult>;

export const extractChunk: ChunkExtractor = async (model, c, total) => {
  const started = Date.now();
  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: [
        { type: "document", source: { type: "base64", media_type: "application/pdf", data: c.b64 } },
        { type: "text", text: chunkInstructions(c.from, c.to, total) },
      ],
    },
  ];
  const format = zodOutputFormat(ModelChunkSchema);

  const msg = supportsFallbacks(model)
    ? await anthropic()
        .beta.messages.stream({
          model,
          max_tokens: 64000,
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
          system: SYSTEM_PROMPT,
          output_config: { effort: EFFORT, format },
          messages: messages as Anthropic.Beta.BetaMessageParam[],
        })
        .finalMessage()
    : await anthropic()
        .messages.stream({
          model,
          max_tokens: 64000,
          system: SYSTEM_PROMPT,
          output_config: { effort: EFFORT, format },
          messages,
        })
        .finalMessage();

  const call: ModelCall = {
    model: msg.model,
    pages: `${c.from}-${c.to}`,
    inputTokens: msg.usage.input_tokens,
    outputTokens: msg.usage.output_tokens,
    costUsd: costOf(msg.model, msg.usage.input_tokens, msg.usage.output_tokens),
    ms: Date.now() - started,
  };

  if (msg.stop_reason === "refusal")
    throw new ExtractionError("model_refused", "Our AI declined to process this document.");
  if (msg.stop_reason === "max_tokens")
    throw new ExtractionError("too_long", "Part of this statement was too dense to process. Try splitting the file.");

  // msg is a beta or non-beta Message; both have text blocks with the same shape.
  const blocks = msg.content as ReadonlyArray<{ type: string; text?: string }>;
  const text = blocks.filter((b) => b.type === "text").map((b) => b.text ?? "").join("");
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new ExtractionError("model_failed", "Extraction returned malformed data. Please retry.");
  }
  const result = ModelChunkSchema.safeParse(parsed);
  if (!result.success) throw new ExtractionError("model_failed", "Extraction returned unexpected data. Please retry.");
  return { chunk: result.data, call };
};

/* ---------------- Merge ---------------- */

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i], i);
      }
    }),
  );
  return out;
}

const firstNonNull = <T>(arr: (T | null)[]) => arr.find((v) => v != null) ?? null;
const lastNonNull = <T>(arr: (T | null)[]) => [...arr].reverse().find((v) => v != null) ?? null;

function buildStatement(fileName: string, pages: number, results: ModelChunk[]): Statement {
  const anyTxns = results.some((r) => r.transactions.length > 0);
  if (!anyTxns && results.some((r) => !r.is_bank_statement))
    throw new ExtractionError("not_statement", "This doesn't look like a bank or credit card statement.");

  const opening = firstNonNull(results.map((r) => r.opening_balance));
  const closing = lastNonNull(results.map((r) => r.closing_balance));
  const raw: Transaction[] = results.flatMap((r) =>
    r.transactions.map((t) => ({
      id: crypto.randomUUID(),
      date: t.date,
      description: t.description.replace(/\s+/g, " ").trim(),
      reference: t.reference,
      debit: t.debit != null ? Math.abs(t.debit) : null,
      credit: t.credit != null ? Math.abs(t.credit) : null,
      balance: t.balance,
      category: t.category,
      page: t.page,
      status: "unchecked" as const,
    })),
  );
  const { transactions, reconciliation } = reconcile(raw, opening, closing);

  return {
    id: crypto.randomUUID(),
    fileName,
    pages,
    bankName: firstNonNull(results.map((r) => r.bank_name)),
    accountHolder: firstNonNull(results.map((r) => r.account_holder)),
    accountLast4: firstNonNull(results.map((r) => r.account_number_last4)),
    accountType: firstNonNull(results.map((r) => r.account_type)),
    currency: firstNonNull(results.map((r) => r.currency)),
    periodStart: firstNonNull(results.map((r) => r.statement_period_start)),
    periodEnd: lastNonNull(results.map((r) => r.statement_period_end)),
    openingBalance: opening,
    closingBalance: closing,
    transactions,
    reconciliation,
    notes: results.flatMap((r) => (r.notes ? [r.notes] : [])),
  };
}

/** Lower is better. Orders results so a pass-2 result only replaces pass 1 when it's actually better. */
function badness(s: Statement): [number, number, number] {
  const rank = { verified: 0, partial: 1, no_balances: 2, mismatch: 3 }[s.reconciliation.status];
  return [rank, s.reconciliation.mismatchRows, Math.abs(s.reconciliation.difference ?? 0)];
}
const better = (a: Statement, b: Statement) => {
  const [x, y] = [badness(a), badness(b)];
  for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] < y[i];
  return false;
};

/** Decide which chunks to re-run on the strong model, or null if the fast result is trustworthy. */
function chunksToEscalate(s: Statement, chunks: Chunk[]): { idx: number[]; reason: string } | null {
  const r = s.reconciliation;
  const all = chunks.map((_, i) => i);
  if (r.status === "verified" || r.status === "partial") return null;
  if (r.status === "no_balances") return { idx: all, reason: "no printed balances to verify against" };
  const pages = new Set(s.transactions.filter((t) => t.status === "mismatch").map((t) => t.page));
  if (pages.size === 0) return { idx: all, reason: `totals off by ${r.difference}` };
  const idx = all.filter((i) => [...pages].some((p) => p >= chunks[i].from && p <= chunks[i].to));
  return { idx: idx.length ? idx : all, reason: `${r.mismatchRows} mismatched row(s) on page(s) ${[...pages].sort((a, b) => a - b).join(", ")}` };
}

/* ---------------- Public API ---------------- */

export interface ExtractOptions {
  mode?: Mode;
  /** Defaults to the Anthropic extractor. */
  extractor?: ChunkExtractor;
  onProgress?: (done: number, total: number) => void;
  onStart?: (chunks: number) => void;
}

export async function extractStatement(
  fileName: string,
  doc: PDFDocument,
  pages: number,
  opts: ExtractOptions = {},
): Promise<Statement> {
  const mode = opts.mode ?? defaultMode();
  const run = opts.extractor ?? extractChunk;
  const started = Date.now();
  const chunks = await splitPdf(doc, pages);
  opts.onStart?.(chunks.length);

  const calls: ModelCall[] = [];
  let done = 0;
  let total = chunks.length;
  const tick = () => opts.onProgress?.(++done, total);
  const firstModel = mode.kind === "cascade" ? mode.fast : mode.model;
  const strongModel = mode.kind === "cascade" ? mode.strong : mode.model;

  // Pass 1. In cascade mode a chunk that errors on the fast model is retried on the strong one before giving up.
  const pass1 = await mapLimit(chunks, CONCURRENCY, async (c) => {
    try {
      const r = await run(firstModel, c, pages);
      calls.push(r.call);
      return r.chunk;
    } catch (e) {
      if (mode.kind !== "cascade" || firstModel === strongModel) throw e;
      const r = await run(strongModel, c, pages);
      calls.push(r.call);
      return r.chunk;
    } finally {
      tick();
    }
  });

  let statement = buildStatement(fileName, pages, pass1);
  let usedPass: 1 | 2 = 1;
  let escalated: number[] = [];
  let reason: string | null = null;

  // Pass 2: escalate only what failed verification.
  const plan = mode.kind === "cascade" && mode.fast !== mode.strong ? chunksToEscalate(statement, chunks) : null;
  if (plan) {
    escalated = plan.idx;
    reason = plan.reason;
    total += plan.idx.length;
    try {
      const redo = await mapLimit(plan.idx, CONCURRENCY, async (i) => {
        try {
          const r = await run(strongModel, chunks[i], pages);
          calls.push(r.call);
          return r.chunk;
        } finally {
          tick();
        }
      });
      const merged = [...pass1];
      plan.idx.forEach((ci, j) => (merged[ci] = redo[j]));
      const candidate = buildStatement(fileName, pages, merged);
      if (better(candidate, statement)) {
        statement = candidate;
        usedPass = 2;
      }
    } catch (e) {
      // Keep the pass-1 result (already flagged for review) rather than failing the whole conversion.
      console.warn("[extract] escalation failed, keeping pass-1 result:", e instanceof Error ? e.message : e);
    }
  }

  const costUsd = calls.reduce((s, c) => s + c.costUsd, 0);
  const meta: ExtractionMeta = {
    mode: mode.kind,
    fastModel: mode.kind === "cascade" ? mode.fast : null,
    strongModel,
    chunks: chunks.length,
    escalatedChunks: escalated,
    escalationReason: reason,
    usedPass,
    calls,
    costUsd: Math.round(costUsd * 1e6) / 1e6,
    costPerPageUsd: Math.round((costUsd / pages) * 1e6) / 1e6,
    ms: Date.now() - started,
  };
  statement.extraction = meta;
  return statement;
}

/** Copy without server-only cost/model metadata — use before sending a statement to the browser. */
export function publicStatement(s: Statement): Statement {
  const copy = { ...s };
  delete copy.extraction;
  return copy;
}

/** One-line summary for server logs (no statement contents). */
export function summarize(s: Statement): string {
  const m = s.extraction;
  if (!m) return "";
  return `[extract] pages=${s.pages} mode=${m.mode} status=${s.reconciliation.status} escalated=${m.escalatedChunks.length}/${m.chunks} usedPass=${m.usedPass} cost=$${m.costUsd.toFixed(4)} ($${m.costPerPageUsd.toFixed(4)}/page) ms=${m.ms}`;
}
