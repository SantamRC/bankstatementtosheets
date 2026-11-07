import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { AppHeader } from "@/components/site/AppHeader";
import { getProfile, getUser, supabaseServer } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { planById } from "@/lib/plans";
import { btn } from "@/lib/ui";
import { BillingButton, ConversionList, type ConversionRow } from "./DashboardClient";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };

async function DashboardInner({ searchParams }: { searchParams: Promise<{ checkout?: string }> }) {
  if (!isSupabaseConfigured) redirect("/convert");
  const user = await getUser();
  if (!user) redirect("/login?next=/dashboard");
  const { checkout } = await searchParams;
  const profile = await getProfile(user.id);
  const { data } = await (await supabaseServer())
    .from("conversions")
    .select("id, file_name, bank_name, pages, transaction_count, reconciliation_status, period_start, period_end, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const plan = planById(profile?.plan ?? "free")!;
  const left = (profile?.monthly_pages_left ?? 0) + (profile?.bonus_pages_left ?? 0);

  return (
    <>
      <AppHeader user={user} authEnabled />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
        {checkout === "success" && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-brand/25 bg-brand-soft p-4 text-sm text-brand-dark">
            <CheckCircle2 className="size-5" /> Payment received — your pages have been added. Thank you!
          </div>
        )}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted">{user.email}</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Your statements</h1>
          </div>
          <Link href="/convert" className={btn("primary", "md")}>New conversion</Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-line-strong bg-card p-5">
            <p className="text-sm text-muted">Plan</p>
            <p className="mt-1 text-2xl font-semibold">{plan.name}</p>
            {profile?.current_period_end && plan.id !== "free" && (
              <p className="mt-1 text-xs text-muted">Renews {new Date(profile.current_period_end).toLocaleDateString()}</p>
            )}
          </div>
          <div className="rounded-2xl border border-line-strong bg-card p-5">
            <p className="text-sm text-muted">Pages left</p>
            <p className="num mt-1 text-2xl font-semibold">{left.toLocaleString()}</p>
            <p className="mt-1 text-xs text-muted">
              {profile?.monthly_pages_left ?? 0} monthly · {profile?.bonus_pages_left ?? 0} bonus (never expire)
            </p>
          </div>
          <div className="flex flex-col justify-between rounded-2xl border border-line-strong bg-card p-5">
            <p className="text-sm text-muted">Pages converted</p>
            <div className="mt-1 flex items-end justify-between gap-2">
              <p className="num text-2xl font-semibold">{(profile?.pages_used ?? 0).toLocaleString()}</p>
              <BillingButton hasCustomer={Boolean(profile?.billing_customer_id)} />
            </div>
          </div>
        </div>

        <h2 className="mt-12 mb-4 text-lg font-semibold">History <span className="text-sm font-normal text-muted">· kept for 30 days</span></h2>
        <ConversionList initial={(data ?? []) as ConversionRow[]} />
      </main>
    </>
  );
}

export default function Dashboard(props: { searchParams: Promise<{ checkout?: string }> }) {
  return (
    <Suspense fallback={<div className="flex-1" />}>
      <DashboardInner {...props} />
    </Suspense>
  );
}
