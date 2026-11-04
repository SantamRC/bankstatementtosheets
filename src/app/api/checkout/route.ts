import { NextRequest, NextResponse } from "next/server";
import { getProfile, getUser, supabaseAdmin } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { PAGE_PACK, isCurrency, planById, stripePriceId, type Currency, type Interval, type PlanId } from "@/lib/plans";
import { SITE_URL, isStripeConfigured, isSupabaseConfigured } from "@/lib/env";

export async function POST(req: NextRequest) {
  if (!isStripeConfigured || !isSupabaseConfigured)
    return NextResponse.json({ error: "Payments aren't configured yet." }, { status: 503 });

  const user = await getUser();
  if (!user) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { plan?: string; interval?: Interval; currency?: string };
  // Each Stripe Price is created in USD with `currency_options` for EUR and INR (see Claude.md §8),
  // so one price ID serves all three currencies; Checkout picks the amount for the requested currency.
  const currency: Currency = isCurrency(body.currency) ? body.currency : "USD";
  const isPack = body.plan === "pack";
  const plan = isPack ? null : planById(body.plan ?? "");
  if (!isPack && (!plan || plan.id === "free")) return NextResponse.json({ error: "Unknown plan" }, { status: 400 });
  const interval: Interval = body.interval === "yearly" ? "yearly" : "monthly";
  const price = stripePriceId(isPack ? "pack" : (plan!.id as PlanId), interval);
  if (!price) return NextResponse.json({ error: "Price not configured" }, { status: 503 });

  const stripe = getStripe();
  const profile = await getProfile(user.id);
  let customer = profile?.stripe_customer_id ?? null;
  if (!customer) {
    const c = await stripe.customers.create({ email: user.email ?? undefined, metadata: { user_id: user.id } });
    customer = c.id;
    await supabaseAdmin().from("profiles").update({ stripe_customer_id: customer }).eq("id", user.id);
  }

  const session = await stripe.checkout.sessions.create({
    mode: isPack ? "payment" : "subscription",
    customer,
    client_reference_id: user.id,
    line_items: [{ price, quantity: 1 }],
    currency: currency.toLowerCase(),
    allow_promotion_codes: true,
    automatic_tax: { enabled: process.env.STRIPE_AUTOMATIC_TAX === "true" },
    customer_update: process.env.STRIPE_AUTOMATIC_TAX === "true" ? { address: "auto" } : undefined,
    metadata: { user_id: user.id, kind: isPack ? "pack" : "subscription", pages: String(isPack ? PAGE_PACK.pages : plan!.pages) },
    success_url: `${SITE_URL}/dashboard?checkout=success`,
    cancel_url: `${SITE_URL}/pricing?checkout=cancelled`,
  });
  return NextResponse.json({ url: session.url });
}
