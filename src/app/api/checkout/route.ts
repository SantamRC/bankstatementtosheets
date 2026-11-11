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

  // Already subscribed: change the existing subscription instead of opening a second one
  // (two subscriptions = double billing, and cancelling the old one would drop the user to Free).
  if (!isPack && profile?.subscription_id) {
    // A stale ID (e.g. test_mode after switching to live_mode) just means "not subscribed": fall through to checkout.
    const sub = await getDodo()
      .subscriptions.retrieve(profile.subscription_id)
      .catch(() => null);
    if (sub && (sub.status === "active" || sub.status === "on_hold")) {
      // A subscription's currency is fixed, so switch to the product in that currency.
      const subCurrency: Currency = isCurrency(sub.currency) ? sub.currency : currency;
      const target = dodoProductId(plan!.id as PlanId, interval, subCurrency);
      if (!target) return NextResponse.json({ error: "This plan isn't available yet." }, { status: 503 });
      if (target === sub.product_id) return NextResponse.json({ error: "You're already on this plan." }, { status: 409 });
      try {
        const res = await getDodo().subscriptions.changePlan(sub.subscription_id, {
          product_id: target,
          quantity: 1,
          // Upgrade: pay the prorated difference now. Downgrade: the unused part is credited.
          proration_billing_mode: "prorated_immediately",
        });
        // A payment link comes back only when the change needs the customer to pay on a checkout page.
        return NextResponse.json({ url: res.payment_link || `${SITE_URL}/dashboard?checkout=changed` });
      } catch (e) {
        console.error("[checkout] plan change failed:", e instanceof Error ? e.message : e);
        return NextResponse.json(
          { error: "Couldn't change your plan here. Use Manage billing on your dashboard, or email support@bankstatementtosheets.com." },
          { status: 502 },
        );
      }
    }
  }

  const create = (customer: { customer_id: string } | { email: string }) =>
    getDodo().checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity: 1 }],
      customer,
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
  try {
    // Reuse the Dodo customer so the billing portal shows every purchase in one place. A stored ID can be stale
    // (e.g. a test_mode customer after switching to live_mode), so fall back to the email; the webhook re-links it.
    let session;
    try {
      session = profile?.billing_customer_id ? await create({ customer_id: profile.billing_customer_id }) : await create({ email: user.email });
    } catch (e) {
      if (!profile?.billing_customer_id) throw e;
      console.warn("[checkout] stored customer rejected, retrying by email:", e instanceof Error ? e.message : e);
      session = await create({ email: user.email });
    }
    if (!session.checkout_url) throw new Error("No checkout URL returned");
    return NextResponse.json({ url: session.checkout_url });
  } catch (e) {
    console.error("[checkout] dodo error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Checkout is unavailable right now. Please try again." }, { status: 502 });
  }
}
