import { Suspense } from "react";
import type { Metadata } from "next";
import { AppHeader } from "@/components/site/AppHeader";
import { Workspace } from "@/components/convert/Workspace";
import { getProfile, getUser, supabaseServer } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { Statement } from "@/lib/extraction/schema";

export const metadata: Metadata = {
  title: "Convert a bank statement",
  description: "Upload a PDF bank statement and convert it to Excel, CSV or Google Sheets with balance verification.",
  alternates: { canonical: "/convert" },
};

async function ConvertPageInner({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { c } = await searchParams;
  const user = await getUser();
  const signedIn = Boolean(user && !user.dev);
  const profile = signedIn ? await getProfile(user!.id) : null;

  let initialStatement: Statement | null = null;
  if (c && signedIn) {
    const { data } = await (await supabaseServer()).from("conversions").select("id, statement").eq("id", c).single();
    if (data) initialStatement = { ...(data.statement as Statement), conversionId: data.id };
  }

  return (
    <>
      <AppHeader user={signedIn ? user : null} authEnabled={isSupabaseConfigured} />
      <main className="flex-1">
        <Workspace
          signedIn={signedIn}
          authEnabled={isSupabaseConfigured}
          initialPages={profile ? profile.monthly_pages_left + profile.bonus_pages_left : null}
          initialStatement={initialStatement}
        />
      </main>
    </>
  );
}

export default function ConvertPage(props: { searchParams: Promise<{ c?: string }> }) {
  return (
    <Suspense fallback={<div className="flex-1" />}>
      <ConvertPageInner {...props} />
    </Suspense>
  );
}
