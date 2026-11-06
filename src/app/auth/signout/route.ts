import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { appUrl, isSupabaseConfigured } from "@/lib/env";

export async function POST(req: NextRequest) {
  if (isSupabaseConfigured) await (await supabaseServer()).auth.signOut();
  return NextResponse.redirect(appUrl("/", req), { status: 303 });
}
