// Cascade/escalation tests with a fake model — no API calls. Run: npm run test:cascade
import assert from "node:assert/strict";
import { PDFDocument } from "pdf-lib";
import { extractStatement, type Chunk, type ChunkExtractor } from "../src/lib/extraction/core";
import type { ModelChunk } from "../src/lib/extraction/schema";

const PAGES = 12; // chunks: 1-5, 6-10, 11-12
const OPENING = 1000;
const FAST = "fake-fast";
const STRONG = "fake-strong";
const cascade = { kind: "cascade" as const, fast: FAST, strong: STRONG };

async function blankPdf(pages: number) {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) doc.addPage();
  return doc;
}

/** One $10 debit per page; balances tie out unless `wrongPage` gets a bad amount. */
function chunkFor(c: Chunk, total: number, wrongPage?: number): ModelChunk {
  const txns = [];
  for (let p = c.from; p <= c.to; p++) {
    txns.push({
      date: `2026-01-${String(p).padStart(2, "0")}`,
      description: `Purchase ${p}`,
      reference: null,
      debit: p === wrongPage ? 99 : 10,
      credit: null,
      balance: OPENING - 10 * p,
      category: "Other" as const,
      page: p,
    });
  }
  return {
    is_bank_statement: true,
    bank_name: "Test Bank",
    account_holder: null,
    account_number_last4: "1234",
    account_type: "checking",
    currency: "USD",
    statement_period_start: "2026-01-01",
    statement_period_end: "2026-01-31",
    opening_balance: c.from === 1 ? OPENING : null,
    closing_balance: c.to === total ? OPENING - 10 * total : null,
    transactions: txns,
    notes: null,
  };
}

function fake(behaviour: (model: string, c: Chunk) => ModelChunk | Error) {
  const calls: string[] = [];
  const extractor: ChunkExtractor = async (model, c, total) => {
    calls.push(`${model}:${c.from}-${c.to}`);
    const r = behaviour(model, c);
    if (r instanceof Error) throw r;
    void total;
    return { chunk: r, call: { model, pages: `${c.from}-${c.to}`, inputTokens: 1000, outputTokens: 500, costUsd: 0, ms: 1 } };
  };
  return { extractor, calls };
}

async function main() {
  const doc = await blankPdf(PAGES);

  // 1. Fast model is right → no escalation.
  {
    const f = fake((_m, c) => chunkFor(c, PAGES));
    const s = await extractStatement("a.pdf", doc, PAGES, { mode: cascade, extractor: f.extractor });
    assert.equal(s.reconciliation.status, "verified");
    assert.equal(s.extraction!.escalatedChunks.length, 0);
    assert.ok(f.calls.every((c) => c.startsWith(FAST)));
    assert.equal(f.calls.length, 3);
  }

  // 2. Fast model misreads page 7 → only chunk 6-10 is re-run on the strong model, which fixes it.
  {
    const f = fake((m, c) => chunkFor(c, PAGES, m === FAST ? 7 : undefined));
    const s = await extractStatement("b.pdf", doc, PAGES, { mode: cascade, extractor: f.extractor });
    assert.deepEqual(s.extraction!.escalatedChunks, [1]);
    assert.equal(s.extraction!.usedPass, 2);
    assert.equal(s.reconciliation.status, "verified");
    assert.deepEqual(f.calls.filter((c) => c.startsWith(STRONG)), [`${STRONG}:6-10`]);
  }

  // 3. Fast model errors on a chunk → that chunk is retried on the strong model; conversion succeeds.
  {
    const f = fake((m, c) => (m === FAST && c.from === 1 ? new Error("malformed") : chunkFor(c, PAGES)));
    const s = await extractStatement("c.pdf", doc, PAGES, { mode: cascade, extractor: f.extractor });
    assert.equal(s.reconciliation.status, "verified");
    assert.ok(f.calls.includes(`${STRONG}:1-5`));
  }

  // 4. Strong model is worse than fast → keep pass 1.
  {
    const f = fake((m, c) => chunkFor(c, PAGES, m === FAST ? 7 : 8));
    const s = await extractStatement("d.pdf", doc, PAGES, {
      mode: cascade,
      extractor: async (m, c, t) => {
        const r = await f.extractor(m, c, t);
        // make strong output strictly worse: also corrupt page 9
        if (m === STRONG) r.chunk.transactions.forEach((x) => x.page === 9 && (x.debit = 55));
        return r;
      },
    });
    assert.equal(s.extraction!.usedPass, 1);
    assert.equal(s.reconciliation.status, "mismatch");
  }

  // 5. Single mode → only the given model, never escalates.
  {
    const f = fake((_m, c) => chunkFor(c, PAGES, 7));
    const s = await extractStatement("e.pdf", doc, PAGES, { mode: { kind: "single", model: STRONG }, extractor: f.extractor });
    assert.equal(f.calls.length, 3);
    assert.ok(f.calls.every((c) => c.startsWith(STRONG)));
    assert.equal(s.extraction!.escalatedChunks.length, 0);
  }

  // 6. No balances at all → everything escalates.
  {
    const f = fake((_m, c) => {
      const ch = chunkFor(c, PAGES);
      ch.opening_balance = null;
      ch.closing_balance = null;
      ch.transactions.forEach((t) => (t.balance = null));
      return ch;
    });
    const s = await extractStatement("f.pdf", doc, PAGES, { mode: cascade, extractor: f.extractor });
    assert.deepEqual(s.extraction!.escalatedChunks, [0, 1, 2]);
  }

  console.log("cascade: all 6 tests passed");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
