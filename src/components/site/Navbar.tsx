import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "./Logo";
import { btn } from "@/lib/ui";
import { hasSessionCookie } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

// Cookie check, not getUser(): getUser() is a round trip to Supabase and made the button pop in seconds late.
async function AccountLink() {
  const user = await hasSessionCookie();
  if (user) return <Link href="/dashboard" className={btn("ghost", "sm")}>Dashboard</Link>;
  if (isSupabaseConfigured) return <Link href="/login" className={btn("ghost", "sm", "hidden sm:inline-flex")}>Sign in</Link>;
  return null;
}

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-1 text-sm md:flex">
          {[
            ["Features", "/#features"],
            ["How it works", "/#how"],
            ["Pricing", "/pricing"],
            ["Security", "/#security"],
            ["FAQ", "/#faq"],
          ].map(([label, href]) => (
            <Link key={href} href={href} className="rounded-full px-3 py-1.5 text-ink-soft transition hover:bg-black/[0.04] hover:text-ink">
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Suspense fallback={<span aria-hidden className={btn("ghost", "sm", "invisible hidden sm:inline-flex")}>Dashboard</span>}>
            <AccountLink />
          </Suspense>
          <Link href="/convert" className={btn("primary", "sm")}>
            <span className="sm:hidden">Convert</span>
            <span className="hidden sm:inline">Convert a statement</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
