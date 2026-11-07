import { NextRequest, NextResponse } from "next/server";
import { getProfile, getUser } from "@/lib/supabase/server";
import { getDodo } from "@/lib/dodo";
import { PAGE_PACK, dodoProductId, isCurrency, planById, type Currency, type Interval, type PlanId } from "@/lib/plans";
import { SITE_URL, isPaymentsConfigured, isSupabaseConfigured } from "@/lib/env";

/** Creates a Dodo hosted checkout for a subscription plan or a one-time page pack. */
export async function POST(req: NextRequest) {
  if (!isPaymentsConfigured || !isSupabaseConfigured)
    return NextResponse.json({ error: "Payments aren't configured yet." }, { status: 503 });

  const user = await getUser();
  if (!user?.email) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { plan?: string; interval?: Interval; currency?: string };
  const currency: Currency = isCurrency(body.currency) ? body.currency : "USD";
  const isPack = body.plan === "pack";
  const plan = isPack ? null : planById(body.plan ?? "");
  if (!isPack && (!plan || plan.id === "free")) return NextResponse.json({ error: "Unknown plan" }, { status: 400 });
  const interval: Interval = body.interval === "yearly" ? "yearly" : "monthly";
  // Per-currency, tax-inclusive product, so the buyer pays exactly the price shown on the pricing page.
  const productId = dodoProductId(isPack ? "pack" : (plan!.id as PlanId), interval, currency);
  if (!productId) return NextResponse.json({ error: "This plan isn't available yet." }, { status: 503 });

  const profile = await getProfile(user.id);
  try {
    const session = await getDodo().checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity: 1 }],
      // Reuse the Dodo customer so the billing portal shows every purchase in one place.
      customer: profile?.billing_customer_id ? { customer_id: profile.billing_customer_id } : { email: user.email },
      billing_currency: currency,
      metadata: {
        user_id: user.id,
        kind: isPack ? "pack" : "subscription",
        plan: isPack ? "pack" : plan!.id,
        interval,
        pages: String(isPack ? PAGE_PACK.pages : plan!.pages),
      },
      return_url: `${SITE_URL}/dashboard?checkout=success`,
      cancel_url: `${SITE_URL}/pricing?checkout=cancelled`,
    });
    if (!session.checkout_url) throw new Error("No checkout URL returned");
    return NextResponse.json({ url: session.checkout_url });
  } catch (e) {
    console.error("[checkout] dodo error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Checkout is unavailable right now. Please try again." }, { status: 502 });
  }
}
