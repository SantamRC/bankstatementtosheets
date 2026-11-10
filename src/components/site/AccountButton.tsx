"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { btn } from "@/lib/ui";

/**
 * The server renders this from the session cookie alone (instant). After load, one background getUser() call
 * confirms the session with Supabase; if it has expired, clear the stale cookie and switch to "Sign in".
 */
export function AccountButton({ signedIn, verify }: { signedIn: boolean; verify: boolean }) {
  const [ok, setOk] = useState(signedIn);

  useEffect(() => {
    if (!signedIn || !verify) return;
    let cancelled = false;
    const supabase = supabaseBrowser();
    supabase.auth
      .getUser()
      .then(async ({ data, error }) => {
        if (cancelled || data.user) return;
        // A network/server failure says nothing about the session, so keep the button as is. Any other answer
        // (missing session, expired or revoked refresh token, 4xx) means the cookie is stale.
        if (error && (error.name === "AuthRetryableFetchError" || !error.status || error.status >= 500)) return;
        await supabase.auth.signOut({ scope: "local" }).catch(() => {});
        if (!cancelled) setOk(false);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [signedIn, verify]);

  return ok ? (
    <Link href="/dashboard" className={btn("ghost", "sm")}>Dashboard</Link>
  ) : (
    <Link href="/login" className={btn("ghost", "sm", "hidden sm:inline-flex")}>Sign in</Link>
  );
}
