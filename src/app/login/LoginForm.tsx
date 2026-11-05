"use client";
import { useState } from "react";
import { ArrowRight, Loader2, Mail } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { btn } from "@/lib/ui";

// Enable once the Google provider is configured in Supabase Auth.
const GOOGLE_ENABLED = process.env.NEXT_PUBLIC_AUTH_GOOGLE === "1";

export function LoginForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const redirectTo = () =>
    `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  async function google() {
    const { error } = await supabaseBrowser().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectTo() },
    });
    if (error) setError(error.message);
  }

  async function magic(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    const { error } = await supabaseBrowser().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo() },
    });
    if (error) {
      setError(error.message);
      setState("error");
    } else setState("sent");
  }

  if (state === "sent")
    return (
      <div className="rounded-xl bg-brand-soft p-5 text-center text-sm text-brand-dark">
        <Mail className="mx-auto mb-2 size-5" />
        Check <span className="font-semibold">{email}</span> for a sign-in link.
      </div>
    );

  return (
    <div className="space-y-4">
      {GOOGLE_ENABLED && (
        <>
          <button onClick={google} className={btn("outline", "lg", "w-full")}>
            <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
              <path
                fill="#EA4335"
                d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.3 12 2.3 6.6 2.3 2.3 6.6 2.3 12s4.3 9.7 9.7 9.7c5.6 0 9.3-3.9 9.3-9.5 0-.6-.1-1.1-.2-1.6H12z"
              />
            </svg>
            Continue with Google
          </button>
          <div className="flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-line" /> or{" "}
            <span className="h-px flex-1 bg-line" />
          </div>
        </>
      )}
      <form onSubmit={magic} className="space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className="h-12 w-full rounded-full border border-line-strong bg-white px-5 text-[15px] outline-none focus:border-ink focus:ring-4 focus:ring-brand/10"
        />
        <button
          disabled={state === "sending"}
          className={btn("primary", "lg", "w-full")}
        >
          {state === "sending" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              Email me a sign-in link <ArrowRight className="size-4" />
            </>
          )}
        </button>
      </form>
      {error && <p className="text-center text-sm text-danger">{error}</p>}
    </div>
  );
}
