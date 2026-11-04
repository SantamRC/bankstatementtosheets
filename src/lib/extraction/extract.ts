import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { PDFDocument } from "pdf-lib";
import { ModelChunkSchema, type ModelChunk, type Statement, type Transaction } from "./schema";
import { reconcile } from "./reconcile";
import { SYSTEM_PROMPT, chunkInstructions } from "./prompt";

export const EXTRACTION_MODEL = process.env.EXTRACTION_MODEL || "claude-opus-5-5";
const EFFORT = (process.env.EXTRACTION_EFFORT || "medium") as "low" | "medium" | "high";
const PAGES_PER_CHUNK = Number(process.env.EXTRACTION_PAGES_PER_CHUNK || 5);
const CONCURRENCY = Number(process.env.EXTRACTION_CONCURRENCY || 4);

export class ExtractionError extends Error {
  constructor(
    public code: "encrypted" | "invalid_pdf" | "not_statement" | "model_refused" | "model_failed" | "too_long",
    message: string,
  ) {
    super(message);
  }
}

let client: Anthropic | null = null;
const anthropic = () => (client ??= new Anthropic({ maxRetries: 3 }));

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

async function splitPdf(doc: PDFDocument, pages: number): Promise<{ b64: string; from: number; to: number }[]> {
  if (pages <= PAGES_PER_CHUNK + 1) {
    const bytes = await doc.save();
    return [{ b64: Buffer.from(bytes).toString("base64"), from: 1, to: pages }];
  }
  const chunks: { b64: string; from: number; to: number }[] = [];
  for (let start = 0; start < pages; start += PAGES_PER_CHUNK) {
    const end = Math.min(start + PAGES_PER_CHUNK, pages);
    const part = await PDFDocument.create();
    const copied = await part.copyPages(
      doc,
      Array.from({ length: end - start }, (_, i) => start + i),
    );
    copied.forEach((p) => part.addPage(p));
    const bytes = await part.save();
    chunks.push({ b64: Buffer.from(bytes).toString("base64"), from: start + 1, to: end });
  }
  return chunks;
}

async function extractChunk(b64: string, from: number, to: number, total: number): Promise<ModelChunk> {
  const stream = anthropic().beta.messages.stream({
    model: EXTRACTION_MODEL,
    max_tokens: 64000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: SYSTEM_PROMPT,
    output_config: { effort: EFFORT, format: zodOutputFormat(ModelChunkSchema) },
    messages: [
      {
        role: "user",
        content: [
          { type: "document", source: { type: "base64", media_type: "application/pdf", data: b64 } },
          { type: "text", text: chunkInstructions(from, to, total) },
        ],
      },
    ],
  });
  const msg = await stream.finalMessage();
  // Unit-economics telemetry: cost per page is the number that decides pricing & model choice.
  console.info(
    `[extract] model=${msg.model} pages=${from}-${to} in=${msg.usage.input_tokens} out=${msg.usage.output_tokens} stop=${msg.stop_reason}`,
  );

  if (msg.stop_reason === "refusal")
    throw new ExtractionError("model_refused", "Our AI declined to process this document.");
  if (msg.stop_reason === "max_tokens")
    throw new ExtractionError("too_long", "Part of this statement was too dense to process. Try splitting the file.");

  const text = msg.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new ExtractionError("model_failed", "Extraction returned malformed data. Please retry.");
  }
  const result = ModelChunkSchema.safeParse(parsed);
  if (!result.success) throw new ExtractionError("model_failed", "Extraction returned unexpected data. Please retry.");
  return result.data;
}

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

export async function extractStatement(
  fileName: string,
  doc: PDFDocument,
  pages: number,
  onProgress: (done: number, total: number) => void,
  onStart?: (chunks: number) => void,
): Promise<Statement> {
  const chunks = await splitPdf(doc, pages);
  onStart?.(chunks.length);
  let done = 0;
  const results = await mapLimit(chunks, CONCURRENCY, async (c) => {
    const r = await extractChunk(c.b64, c.from, c.to, pages);
    onProgress(++done, chunks.length);
    return r;
  });

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
