import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { getDodo } from "@/lib/dodo";
import { sendRenewalReminder } from "@/lib/email";
import { planById, planFromProductId } from "@/lib/plans";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * Daily (GitHub Action `cron.yml`, Bearer CRON_SECRET): email yearly subscribers whose renewal is 7–8 days away.
 * The one-day window plus a once-a-day run means each renewal gets one reminder. Monthly plans get none (a monthly
 * nudge mostly drives churn; Dodo's receipt covers each charge).
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET ?? "";
  const got = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!secret || got.length !== secret.length || !timingSafeEqual(Buffer.from(got), Buffer.from(secret)))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const day = 86_400_000;
  const { data: due, error } = await supabaseAdmin()
    .from("profiles")
    .select("id, email, subscription_id, current_period_end")
    .eq("subscription_status", "active")
    .not("subscription_id", "is", null)
    .gte("current_period_end", new Date(Date.now() + 7 * day).toISOString())
    .lt("current_period_end", new Date(Date.now() + 8 * day).toISOString());
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const dodo = getDodo();
  let sent = 0;
  for (const p of due ?? []) {
    try {
      const sub = await dodo.subscriptions.retrieve(p.subscription_id!);
      if (sub.status !== "active" || sub.cancel_at_next_billing_date || sub.payment_frequency_interval !== "Year") continue;
      // The product's own price (not plans.ts) so launch-locked subscribers see what they'll actually pay.
      const product = await dodo.products.retrieve(sub.product_id);
      const minor = "price" in product.price ? product.price.price : sub.recurring_pre_tax_amount;
      const amount =
        new Intl.NumberFormat("en-US", { style: "currency", currency: sub.currency }).format(minor / 100) +
        (product.price.tax_inclusive ? " (tax included)" : " plus tax");
      const date = new Date(sub.next_billing_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
      const planName = planById(planFromProductId(sub.product_id) ?? "")?.name ?? "paid";
      if (p.email) {
        await sendRenewalReminder(p.email, { planName, amount, date });
        sent++;
      }
    } catch (e) {
      console.error("[cron] renewal reminder failed:", e instanceof Error ? e.message : e);
    }
  }
  return NextResponse.json({ checked: due?.length ?? 0, sent });
}
