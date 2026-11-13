"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Loader2, Mail } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { btn } from "@/lib/ui";

// Enable once the Google provider is configured in Supabase Auth.
const GOOGLE_ENABLED = process.env.NEXT_PUBLIC_AUTH_GOOGLE === "1";
/** Must match Auth → Email → "Email OTP length" in Supabase (staging and prod). */
const CODE_LENGTH = 6;
const RESEND_AFTER_S = 60; // Supabase allows one email per address every 60s
const PENDING_KEY = "bsts:login-email";

export function LoginForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);
  const redirectTo = () => `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
  const go = useCallback(() => location.assign(next), [next]);

  // A refresh of the "check your email" screen keeps the code box (sessionStorage is per tab).
  useEffect(() => {
    try {
      const pending = sessionStorage.getItem(PENDING_KEY);
      if (pending) {
        // Read after mount (not in useState) so the server render and hydration match.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setEmail(pending);
        setState("sent");
      }
    } catch {}
  }, []);

  // Signed in from the email link in another tab of this browser? The session cookie is shared, so continue here too.
  useEffect(() => {
    if (state !== "sent") return;
    const check = async () => {
      const { data } = await supabaseBrowser().auth.getSession();
      if (data.session) {
        try { sessionStorage.removeItem(PENDING_KEY); } catch {}
        go();
      }
    };
    const id = setInterval(check, 3000);
    window.addEventListener("focus", check);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", check);
    };
  }, [state, go]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  async function google() {
    const { error } = await supabaseBrowser().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectTo() },
    });
    if (error) setError(error.message);
  }

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setState("sending");
    const { error } = await supabaseBrowser().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo() },
    });
    if (error) {
      setError(error.message);
      setState("error");
      return;
    }
    try { sessionStorage.setItem(PENDING_KEY, email); } catch {}
    setCode("");
    setCooldown(RESEND_AFTER_S);
    setState("sent");
    setTimeout(() => codeRef.current?.focus(), 50);
  }

  async function verify(token: string) {
    if (verifying) return;
    setVerifying(true);
    setError(null);
    const { error } = await supabaseBrowser().auth.verifyOtp({ email, token, type: "email" });
    if (error) {
      setVerifying(false);
      setError(/expired|invalid/i.test(error.message) ? "That code is wrong or has expired. Check the latest email, or send a new code." : error.message);
      setCode("");
      codeRef.current?.focus();
      return;
    }
    try { sessionStorage.removeItem(PENDING_KEY); } catch {}
    go();
  }

  function onCode(v: string) {
    const digits = v.replace(/\D/g, "").slice(0, CODE_LENGTH);
    setCode(digits);
    if (digits.length === CODE_LENGTH) verify(digits);
  }

  function changeEmail() {
    try { sessionStorage.removeItem(PENDING_KEY); } catch {}
    setState("idle");
    setCode("");
    setError(null);
  }

  if (state === "sent")
    return (
      <div className="space-y-4">
        <div className="rounded-xl bg-brand-soft p-5 text-center text-sm text-brand-dark">
          <Mail className="mx-auto mb-2 size-5" />
          We emailed a {CODE_LENGTH}-digit code to <span className="font-semibold">{email}</span>.
          <span className="mt-1 block text-brand-dark/80">Type it below, or click the link in the email.</span>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (code.length === CODE_LENGTH) verify(code);
          }}
          className="space-y-3"
        >
          <label htmlFor="otp" className="sr-only">Sign-in code</label>
          <input
            id="otp"
            ref={codeRef}
            value={code}
            onChange={(e) => onCode(e.target.value)}
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={CODE_LENGTH}
            placeholder={"•".repeat(CODE_LENGTH)}
            autoFocus
            disabled={verifying}
            className="num h-14 w-full rounded-full border border-line-strong bg-white px-5 text-center text-2xl tracking-[0.5em] outline-none focus:border-ink focus:ring-4 focus:ring-brand/10 disabled:opacity-60"
          />
          <button disabled={verifying || code.length !== CODE_LENGTH} className={btn("primary", "lg", "w-full")}>
            {verifying ? <Loader2 className="size-4 animate-spin" /> : <>Sign in <ArrowRight className="size-4" /></>}
          </button>
        </form>
        {error && <p className="text-center text-sm text-danger">{error}</p>}
        <div className="flex items-center justify-between text-xs text-muted">
          <button type="button" onClick={changeEmail} className="underline-offset-2 hover:text-ink hover:underline">
            Use a different email
          </button>
          <button
            type="button"
            onClick={() => send()}
            disabled={cooldown > 0}
            className="underline-offset-2 hover:text-ink hover:underline disabled:no-underline disabled:opacity-60"
          >
            {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
          </button>
        </div>
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
      <form onSubmit={send} className="space-y-3">
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
              Email me a sign-in code <ArrowRight className="size-4" />
            </>
          )}
        </button>
      </form>
      {error && <p className="text-center text-sm text-danger">{error}</p>}
    </div>
  );
}
