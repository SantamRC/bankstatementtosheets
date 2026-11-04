import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Check } from "lucide-react";
import { Logo } from "@/components/site/Logo";
import { LoginForm } from "./LoginForm";
import { getUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { FREE_PAGES } from "@/lib/plans";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

async function LoginPageInner({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next = "/convert", error } = await searchParams;
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/convert";
  if (!isSupabaseConfigured) redirect("/convert");
  const user = await getUser();
  if (user && !user.dev) redirect(safeNext);

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Logo />
        <div className="mx-auto my-auto w-full max-w-sm py-12">
          <h1 className="text-3xl font-semibold tracking-tight">Start converting free</h1>
          <p className="mt-2 text-ink-soft">Sign in or create an account — it takes 10 seconds.</p>
          {error && <p className="mt-4 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">That sign-in link expired. Please try again.</p>}
          <div className="mt-8">
            <LoginForm next={safeNext} />
          </div>
          <p className="mt-8 text-center text-xs text-muted">
            By continuing you agree to our <Link href="/terms" className="underline">Terms</Link> and{" "}
            <Link href="/privacy" className="underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-ink p-12 text-paper lg:flex lg:flex-col lg:justify-end">
        <div className="grid-bg absolute inset-0 opacity-20 invert" />
        <div className="relative">
          <p className="font-serif text-5xl leading-[1.05]">
            A year of statements, <span className="italic text-lime">reconciled</span> before your coffee goes cold.
          </p>
          <ul className="mt-10 space-y-3 text-paper/80">
            {[`${FREE_PAGES} free pages, no card`, "Every row verified against your balances", "PDFs processed in memory, never stored"].map((t) => (
              <li key={t} className="flex items-center gap-2.5">
                <span className="grid size-5 place-items-center rounded-full bg-lime"><Check className="size-3 text-ink" strokeWidth={3} /></span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage(props: { searchParams: Promise<{ next?: string; error?: string }> }) {
  return (
    <Suspense fallback={<div className="flex-1" />}>
      <LoginPageInner {...props} />
    </Suspense>
  );
}
