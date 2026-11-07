import "server-only";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, isDevAuthBypass, isSupabaseConfigured } from "@/lib/env";

/** Supabase client acting as the signed-in user (RLS applies). */
export async function supabaseServer() {
  // supabase-js reads Date.now() for session expiry; mark this render as request-time so Next 16
  // (cacheComponents) doesn't flag it as an unstable value during prerendering.
  await connection();
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component — the proxy refreshes sessions instead.
        }
      },
    },
  });
}

/** Privileged client for webhooks and credit accounting. Never expose to the browser. */
export function supabaseAdmin() {
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SECRET_KEY is not set");
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export interface SessionUser {
  id: string;
  email: string | null;
  dev?: boolean;
}

/** Returns the current user, a dev user when Supabase isn't configured, or null. */
export async function getUser(): Promise<SessionUser | null> {
  if (isDevAuthBypass) return { id: "dev-user", email: "dev@localhost", dev: true };
  if (!isSupabaseConfigured) return null;
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  return data.user ? { id: data.user.id, email: data.user.email ?? null } : null;
}

export interface Profile {
  id: string;
  email: string | null;
  plan: "free" | "starter" | "pro" | "business";
  monthly_pages_left: number;
  bonus_pages_left: number;
  pages_used: number;
  billing_customer_id: string | null;
  subscription_id: string | null;
  subscription_status: string | null;
  current_period_end: string | null;
  monthly_allowance: number;
  allowance_resets_at: string | null;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = await supabaseServer();
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
  const p = (data as Profile) ?? null;
  // Yearly plans refill monthly; consume_pages() applies it lazily, so show the refilled value here too.
  if (p && p.monthly_allowance > 0 && p.allowance_resets_at && Date.parse(p.allowance_resets_at) <= Date.now())
    p.monthly_pages_left = p.monthly_allowance;
  return p;
}
