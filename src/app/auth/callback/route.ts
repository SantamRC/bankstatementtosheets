import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { appUrl } from "@/lib/env";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/convert";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/convert";
  if (code) {
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(appUrl(safeNext, req));
  }
  return NextResponse.redirect(appUrl("/login?error=auth", req));
}
