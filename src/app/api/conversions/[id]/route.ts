import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!isSupabaseConfigured) return NextResponse.json({ ok: true });
  const { id } = await ctx.params;
  const { error } = await (await supabaseServer()).from("conversions").delete().eq("id", id);
  return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ ok: true });
}
