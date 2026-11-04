import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { exchangeCode } from "@/lib/google";

/** Runs inside the OAuth popup: stores tokens, notifies the opener, closes itself. */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const jar = await cookies();
  const expected = jar.get("bsts_gstate")?.value;
  jar.delete("bsts_gstate");
  let ok = false;
  const code = url.searchParams.get("code");
  if (code && expected && url.searchParams.get("state") === expected) {
    try {
      await exchangeCode(code);
      ok = true;
    } catch {}
  }
  const html = `<!doctype html><meta charset="utf-8"><title>Google connected</title>
<body style="font-family:system-ui;display:grid;place-items:center;height:100vh;margin:0;color:#0b1220">
<p>${ok ? "Google connected — you can close this window." : "Couldn't connect Google. Please try again."}</p>
<script>try{window.opener&&window.opener.postMessage({type:"bsts-google",ok:${ok}},location.origin)}catch(e){};setTimeout(()=>window.close(),${ok ? 300 : 3000});</script>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
