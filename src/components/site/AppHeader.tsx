import Link from "next/link";
import { Logo } from "./Logo";
import { btn } from "@/lib/ui";
import type { SessionUser } from "@/lib/supabase/server";

export function AppHeader({ user, authEnabled }: { user: SessionUser | null; authEnabled: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-1 text-sm">
          <Link href="/convert" className={btn("ghost", "sm")}>Convert</Link>
          {authEnabled && user && <Link href="/dashboard" className={btn("ghost", "sm")}>History</Link>}
          <Link href="/pricing" className={btn("ghost", "sm", "hidden sm:inline-flex")}>Pricing</Link>
          {authEnabled && !user && <Link href="/login?next=/convert" className={btn("primary", "sm")}>Sign in</Link>}
          {authEnabled && user && (
            <form action="/auth/signout" method="post">
              <button className={btn("outline", "sm")} title={user.email ?? undefined}>Sign out</button>
            </form>
          )}
        </nav>
      </div>
    </header>
  );
}
