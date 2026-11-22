"use client";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id: string) => void;
      remove: (id: string) => void;
    };
  }
}

const SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  let s = document.querySelector<HTMLScriptElement>(`script[src="${SRC}"]`);
  if (!s) {
    s = document.createElement("script");
    s.src = SRC;
    s.async = true;
    document.head.appendChild(s);
  }
  return new Promise((resolve) => s!.addEventListener("load", () => resolve(), { once: true }));
}

/**
 * Cloudflare Turnstile bot check for the no-account trial. `onToken(null)` when the token expires or is used up;
 * `resetRef` lets the parent ask for a fresh token after an upload (tokens are single-use).
 */
export function Turnstile({
  siteKey,
  onToken,
  resetRef,
}: {
  siteKey: string;
  onToken: (token: string | null) => void;
  resetRef: React.RefObject<(() => void) | null>;
}) {
  const el = useRef<HTMLDivElement>(null);
  const cb = useRef(onToken);
  useEffect(() => {
    cb.current = onToken;
  });

  useEffect(() => {
    let id: string | null = null;
    let cancelled = false;
    loadScript().then(() => {
      if (cancelled || !el.current || !window.turnstile) return;
      id = window.turnstile.render(el.current, {
        sitekey: siteKey,
        appearance: "interaction-only",
        callback: (t: string) => cb.current(t),
        "expired-callback": () => cb.current(null),
        "error-callback": () => cb.current(null),
      });
      resetRef.current = () => {
        cb.current(null);
        if (id) window.turnstile?.reset(id);
      };
    });
    return () => {
      cancelled = true;
      resetRef.current = null;
      if (id) window.turnstile?.remove(id);
    };
  }, [siteKey, resetRef]);

  return <div ref={el} className="flex justify-center empty:hidden" />;
}
