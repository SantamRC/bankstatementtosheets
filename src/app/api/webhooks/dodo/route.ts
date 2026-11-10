import { NextRequest } from "next/server";
import type { UnwrapWebhookEvent } from "dodopayments/resources/webhooks/webhooks";
import { getDodo } from "@/lib/dodo";
import { supabaseAdmin } from "@/lib/supabase/server";
import { planById, planFromProductId } from "@/lib/plans";
import { sendPackAdded, sendPlanWelcome } from "@/lib/email";

type Meta = Record<string, string | number | boolean> | null | undefined;
type Customer = { customer_id: string; email: string };

/**
 * Dodo webhooks (Standard Webhooks signature, DODO_PAYMENTS_WEBHOOK_KEY).
 * Subscribe in Dodo → Developer → Webhooks to: payment.succeeded, subscription.active, subscription.renewed,
 * subscription.plan_changed, subscription.updated, subscription.on_hold, subscription.failed,
 * subscription.cancelled, subscription.expired.
 */
export async function POST(req: NextRequest) {
  const body = await req.text();
  let event: UnwrapWebhookEvent;
  try {
    event = getDodo().webhooks.unwrap(body, { headers: Object.fromEntries(req.headers) });
  } catch {
    return new Response("Bad signature", { status: 401 });
  }

  const db = supabaseAdmin();

  // Idempotency: Dodo retries until it gets a 2xx, so record each delivery id once.
  const webhookId = req.headers.get("webhook-id");
  if (webhookId) {
    const { error } = await db.from("webhook_events").insert({ id: webhookId, type: event.type });
    if (error?.code === "23505") return new Response("duplicate");
    if (error) return new Response("db error", { status: 500 }); // let Dodo retry
  }

  /** Our user for this event: checkout metadata first, then the stored Dodo customer id, then email. */
  const findUser = async (meta: Meta, customer: Customer): Promise<string | null> => {
    let id: string | null = meta?.user_id ? String(meta.user_id) : null;
    if (!id) {
      const { data } = await db.from("profiles").select("id").eq("billing_customer_id", customer.customer_id).maybeSingle();
      id = data?.id ?? null;
    }
    if (!id && customer.email) {
      const { data } = await db.from("profiles").select("id").ilike("email", customer.email).maybeSingle();
      id = data?.id ?? null;
    }
    if (id) await db.from("profiles").update({ billing_customer_id: customer.customer_id }).eq("id", id);
    return id;
  };

  /** Our branded email. Never throws: a failed email must not make Dodo retry (that would re-grant pack pages). */
  const notify = async (userId: string, fallbackEmail: string, fn: (to: string) => Promise<void>) => {
    try {
      const { data } = await db.from("profiles").select("email").eq("id", userId).maybeSingle();
      const to = data?.email || fallbackEmail;
      if (to) await fn(to);
    } catch (e) {
      console.error(`[dodo] ${event.type} email failed:`, e instanceof Error ? e.message : e);
    }
  };

  try {
    switch (event.type) {
      case "payment.succeeded": {
        // One-time page packs only; subscription payments are handled by the subscription.* events.
        const p = event.data;
        if (p.metadata?.kind !== "pack" || p.subscription_ids?.length) break;
        const userId = await findUser(p.metadata, p.customer);
        const pages = Number(p.metadata.pages || 0);
        if (userId && pages > 0) {
          const { error } = await db.rpc("add_bonus_pages", { p_user: userId, p_pages: pages });
          if (error) throw new Error(error.message);
          await notify(userId, p.customer.email, (to) => sendPackAdded(to, pages));
        }
        break;
      }
      case "subscription.active":
      case "subscription.renewed":
      case "subscription.plan_changed": {
        // Start, each renewal and plan changes: (re)grant the plan's monthly allowance.
        const s = event.data;
        const planId = planFromProductId(s.product_id);
        const userId = await findUser(s.metadata, s.customer);
        if (!userId || !planId) {
          console.warn(`[dodo] ${event.type}: unmatched user=${Boolean(userId)} product=${s.product_id}`);
          break;
        }
        const pages = planById(planId)!.pages;
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        await db
          .from("profiles")
          .update({
            plan: planId,
            monthly_allowance: pages,
            monthly_pages_left: pages,
            allowance_resets_at: nextMonth.toISOString(),
            subscription_id: s.subscription_id,
            subscription_status: s.status,
            current_period_end: s.next_billing_date,
          })
          .eq("id", userId);
        // Renewals stay quiet (Dodo emails the receipt); welcome on start, confirm on plan change.
        if (event.type !== "subscription.renewed")
          await notify(userId, s.customer.email, (to) =>
            sendPlanWelcome(to, planById(planId)!.name, pages, event.type === "subscription.plan_changed"),
          );
        break;
      }
      case "subscription.updated":
      case "subscription.on_hold":
      case "subscription.failed": {
        const s = event.data;
        const userId = await findUser(s.metadata, s.customer);
        if (!userId) break;
        const paused = event.type !== "subscription.updated";
        await db
          .from("profiles")
          .update({
            subscription_status: s.status,
            current_period_end: s.next_billing_date,
            // Payment failed: stop handing out monthly pages until the subscription is active again.
            ...(paused ? { monthly_pages_left: 0, allowance_resets_at: null } : {}),
          })
          .eq("id", userId);
        break;
      }
      case "subscription.cancelled":
      case "subscription.expired": {
        const s = event.data;
        const userId = await findUser(s.metadata, s.customer);
        if (!userId) break;
        await db
          .from("profiles")
          .update({
            plan: "free",
            monthly_allowance: 0,
            monthly_pages_left: 0,
            allowance_resets_at: null,
            subscription_status: s.status,
          })
          .eq("id", userId);
        break;
      }
    }
  } catch (e) {
    console.error(`[dodo] ${event.type} failed:`, e instanceof Error ? e.message : e);
    if (webhookId) await db.from("webhook_events").delete().eq("id", webhookId); // allow the retry through
    return new Response("handler error", { status: 500 });
  }
  return new Response("ok");
}
