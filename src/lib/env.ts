/** Central place for feature flags derived from env, so the app runs locally with only ANTHROPIC_API_KEY. */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);

/** Local dev without Supabase: skip auth & metering. Never in production — that would mean free, unmetered conversions. */
export const isDevAuthBypass = !isSupabaseConfigured && process.env.NODE_ENV !== "production";
export const isStripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);
export const isGoogleConfigured = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

/**
 * Absolute URL for server redirects. Behind Render's proxy `req.url` is http://localhost:10000,
 * so production always uses the canonical SITE_URL (also immune to Host-header spoofing).
 */
export function appUrl(path: string, req: Request): URL {
  const base = process.env.NODE_ENV === "production" ? SITE_URL : new URL(req.url).origin;
  return new URL(path, base);
}
