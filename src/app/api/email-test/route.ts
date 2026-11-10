import { NextResponse } from "next/server";
import { getProfile, getUser } from "@/lib/supabase/server";
import { isEmailConfigured, sendPlanWelcome } from "@/lib/email";
import { planById } from "@/lib/plans";

/** TEMPORARY (remove after verifying Brevo on prod): sends the welcome email to the signed-in user's own address. */
const sent = new Set<string>();
export async function POST() {
  const user = await getUser();
  if (!user?.email) return NextResponse.json({ error: "auth_required" }, { status: 401 });
  if (!isEmailConfigured) return NextResponse.json({ error: "BREVO_API_KEY not set" }, { status: 503 });
  if (sent.has(user.id)) return NextResponse.json({ error: "already sent" }, { status: 429 });
  sent.add(user.id);
  const plan = planById((await getProfile(user.id))?.plan ?? "starter") ?? planById("starter")!;
  try {
    await sendPlanWelcome(user.email, plan.name, plan.pages);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "failed" }, { status: 502 });
  }
}
