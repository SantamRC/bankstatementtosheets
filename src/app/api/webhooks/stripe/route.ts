import { NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/server";
import { planById, planFromPriceId } from "@/lib/plans";


export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return new Response("Bad signature", { status: 400 });
  }

  const db = supabaseAdmin();
  const profileByCustomer = async (customer: string | Stripe.Customer | Stripe.DeletedCustomer | null) => {
    const id = typeof customer === "string" ? customer : customer?.id;
    if (!id) return null;
    const { data } = await db.from("profiles").select("id, bonus_pages_left").eq("stripe_customer_id", id).single();
    return data as { id: string; bonus_pages_left: number } | null;
  };

  switch (event.type) {
    case "checkout.session.completed": {
      // One-time page packs. Subscriptions are handled by invoice.paid below.
      const s = event.data.object;
      if (s.mode === "payment" && s.payment_status === "paid" && s.metadata?.kind === "pack") {
        const profile = await profileByCustomer(s.customer);
        if (profile)
          await db
            .from("profiles")
            .update({ bonus_pages_left: profile.bonus_pages_left + Number(s.metadata.pages || 0) })
            .eq("id", profile.id);
      }
      break;
    }
    case "invoice.paid": {
      // First payment and every renewal: reset the monthly allowance for the active plan.
      const invoice = event.data.object;
      const profile = await profileByCustomer(invoice.customer);
      if (!profile) break;
      const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
      if (!customerId) break;
      const subs = await stripe.subscriptions.list({ customer: customerId, status: "active", limit: 1 });
      const sub = subs.data[0];
      const planId = sub ? planFromPriceId(sub.items.data[0]?.price.id ?? "") : null;
      if (!sub || !planId) break;
      await db
        .from("profiles")
        .update({
          plan: planId,
          monthly_pages_left: planById(planId)!.pages,
          subscription_status: sub.status,
          current_period_end: new Date((sub.items.data[0]?.current_period_end ?? 0) * 1000).toISOString(),
        })
        .eq("id", profile.id);
      break;
    }
    case "customer.subscription.updated": {
      const sub = event.data.object;
      const profile = await profileByCustomer(sub.customer);
      if (!profile) break;
      const planId = planFromPriceId(sub.items.data[0]?.price.id ?? "");
      await db
        .from("profiles")
        .update({ subscription_status: sub.status, ...(planId ? { plan: planId } : {}) })
        .eq("id", profile.id);
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object;
      const profile = await profileByCustomer(sub.customer);
      if (profile)
        await db
          .from("profiles")
          .update({ plan: "free", monthly_pages_left: 0, subscription_status: "canceled" })
          .eq("id", profile.id);
      break;
    }
  }
  return new Response("ok");
}
