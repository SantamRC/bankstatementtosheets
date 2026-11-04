import { NextResponse } from "next/server";
import { getProfile, getUser } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { SITE_URL, isStripeConfigured } from "@/lib/env";

export async function POST() {
  const user = await getUser();
  if (!user || !isStripeConfigured) return NextResponse.json({ error: "unavailable" }, { status: 400 });
  const profile = await getProfile(user.id);
  if (!profile?.stripe_customer_id) return NextResponse.json({ error: "No billing account yet." }, { status: 400 });
  const session = await getStripe().billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${SITE_URL}/dashboard`,
  });
  return NextResponse.json({ url: session.url });
}
