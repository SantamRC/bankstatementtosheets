import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export async function POST(req: NextRequest) {
  if (isSupabaseConfigured) await (await supabaseServer()).auth.signOut();
  return NextResponse.redirect(new URL("/", req.url), { status: 303 });
}
