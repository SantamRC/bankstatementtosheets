// Render health check. Kept dependency-free so a Supabase/Stripe outage doesn't restart the service.
export function GET() {
  return Response.json({ ok: true });
}
