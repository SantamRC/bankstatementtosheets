import { NextRequest } from "next/server";
import { ExtractionError, extractStatement, inspectPdf } from "@/lib/extraction/extract";
import type { ExtractEvent } from "@/lib/extraction/schema";
import { getUser, supabaseAdmin } from "@/lib/supabase/server";
import { isDevAuthBypass, isSupabaseConfigured } from "@/lib/env";

const MAX_BYTES = 25 * 1024 * 1024;
const MAX_PAGES = Number(process.env.MAX_PAGES_PER_FILE || 150);

const json = (status: number, code: string, message: string) =>
  Response.json({ type: "error", code, message } satisfies ExtractEvent, { status });

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured && !isDevAuthBypass)
    return json(503, "not_configured", "Converting your own statements opens very soon. Try the sample in the meantime!");
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN)
    return json(500, "not_configured", "Server is missing ANTHROPIC_API_KEY.");

  const user = await getUser();
  if (!user) return json(401, "auth_required", "Create a free account to convert statements.");

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return json(400, "no_file", "No file uploaded.");
  if (file.size > MAX_BYTES) return json(413, "too_large", "Files up to 25 MB are supported.");

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (String.fromCharCode(...bytes.subarray(0, 5)) !== "%PDF-")
    return json(415, "not_pdf", "Please upload a PDF statement.");

  let inspected: Awaited<ReturnType<typeof inspectPdf>>;
  try {
    inspected = await inspectPdf(bytes);
  } catch (e) {
    if (e instanceof ExtractionError) return json(422, e.code, e.message);
    throw e;
  }
  const { doc, pages } = inspected;
  if (pages > MAX_PAGES) return json(413, "too_many_pages", `Statements up to ${MAX_PAGES} pages are supported per file.`);

  // Reserve pages atomically before spending money on extraction; refunded on failure.
  const metered = isSupabaseConfigured && !user.dev;
  let pagesRemaining: number | null = null;
  if (metered) {
    const { data, error } = await supabaseAdmin().rpc("consume_pages", { p_user: user.id, p_pages: pages });
    if (error) return json(500, "billing_error", "Couldn't check your page balance. Please retry.");
    if (data === -1)
      return json(402, "out_of_pages", `This statement has ${pages} pages and you're out of pages. Upgrade to keep converting.`);
    pagesRemaining = data as number;
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (e: ExtractEvent) => controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
      // Cloudflare drops proxied connections idle for 100s; a dense chunk can take longer, so ping every 15s.
      const heartbeat = setInterval(() => send({ type: "ping" }), 15_000);
      try {
        const statement = await extractStatement(
          file.name,
          doc,
          pages,
          (done, total) => send({ type: "progress", done, total }),
          (chunks) => send({ type: "start", pages, chunks }),
        );

        if (metered) {
          const { data } = await supabaseAdmin()
            .from("conversions")
            .insert({
              user_id: user.id,
              file_name: file.name,
              pages,
              bank_name: statement.bankName,
              currency: statement.currency,
              period_start: statement.periodStart,
              period_end: statement.periodEnd,
              transaction_count: statement.transactions.length,
              reconciliation_status: statement.reconciliation.status,
              statement,
            })
            .select("id")
            .single();
          statement.conversionId = data?.id ?? null;
        }
        send({ type: "result", statement, pagesRemaining });
      } catch (e) {
        if (metered) await supabaseAdmin().rpc("refund_pages", { p_user: user.id, p_pages: pages });
        const err =
          e instanceof ExtractionError
            ? { code: e.code, message: e.message }
            : { code: "server_error", message: "Something went wrong while converting. Your pages were not charged." };
        if (!(e instanceof ExtractionError)) console.error("[extract]", e);
        send({ type: "error", ...err });
      } finally {
        clearInterval(heartbeat);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" },
  });
}
