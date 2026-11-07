import { NextResponse } from "next/server";
import { getProfile, getUser } from "@/lib/supabase/server";
import { getDodo } from "@/lib/dodo";
import { SITE_URL, isPaymentsConfigured } from "@/lib/env";

/** Dodo customer portal: invoices, payment method, cancel/change plan. */
export async function POST() {
  const user = await getUser();
  if (!user || !isPaymentsConfigured) return NextResponse.json({ error: "unavailable" }, { status: 400 });
  const profile = await getProfile(user.id);
  if (!profile?.billing_customer_id) return NextResponse.json({ error: "No billing account yet." }, { status: 400 });
  try {
    const portal = await getDodo().customers.customerPortal.create(profile.billing_customer_id, {
      return_url: `${SITE_URL}/dashboard`,
    });
    return NextResponse.json({ url: portal.link });
  } catch (e) {
    console.error("[billing-portal] dodo error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Billing portal is unavailable right now." }, { status: 502 });
  }
}
