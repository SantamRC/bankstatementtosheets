"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { CurrencyPicker } from "@/components/ui/CurrencyPicker";
import {
  DEFAULT_CURRENCY,
  LAUNCH_OFFER,
  PAGE_PACK,
  PLANS,
  formatPrice,
  guessCurrency,
  isCurrency,
  type Currency,
  type Interval,
} from "@/lib/plans";
import { btn, cn } from "@/lib/ui";

const CURRENCY_KEY = "bsts:currency";

export function Pricing({ heading = true }: { heading?: boolean }) {
  const [interval, setBilling] = useState<Interval>("yearly");
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrencyState] = useState<Currency>(DEFAULT_CURRENCY);

  // Pick the visitor's currency after mount (remembered choice first, then a time-zone guess).
  useEffect(() => {
    let next: Currency = DEFAULT_CURRENCY;
    try {
      const saved = localStorage.getItem(CURRENCY_KEY);
      next = isCurrency(saved) ? saved : guessCurrency();
    } catch {
      next = guessCurrency();
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading browser-only locale/storage
    setCurrencyState(next);
  }, []);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    try {
      localStorage.setItem(CURRENCY_KEY, c);
    } catch {}
  };
  const fmt = (n: number) => formatPrice(n, currency);
  const perPage = (n: number) => formatPrice(n, currency, currency === "INR" ? 2 : 3);

  async function checkout(plan: string) {
    setLoading(plan);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, interval, currency }),
      });
      if (res.status === 401) {
        router.push(`/login?next=${encodeURIComponent("/pricing")}`);
        return;
      }
      const j = await res.json();
      if (j.url) window.location.href = j.url;
      else setError(j.error ?? "Checkout is unavailable right now.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <section id="pricing" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      {heading && (
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold text-brand">Pricing</p>
          <h2 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
            Pay per page, <span className="font-serif font-normal italic">not per headache.</span>
          </h2>
          <p className="mt-4 text-lg text-muted">
            One page of statement = one credit, whether it has 3 transactions or 60. Failed conversions are never charged.
          </p>
        </div>
      )}

      {LAUNCH_OFFER.active && (
        <div className="mx-auto mt-8 flex max-w-2xl items-center justify-center gap-3 rounded-2xl sm:rounded-full border border-brand/25 bg-brand-soft px-4 py-2 text-sm text-brand-dark">
          <span className="shrink-0 rounded-full bg-lime px-2 py-0.5 text-[11px] font-bold tracking-wide whitespace-nowrap text-ink uppercase">{LAUNCH_OFFER.label}</span>
          <span>
            Subscribe before{" "}
            <span className="font-semibold">
              {new Date(`${LAUNCH_OFFER.endsOn}T00:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}
            </span>{" "}
            and keep your price for as long as you stay subscribed.
          </span>
        </div>
      )}

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <div className="inline-flex rounded-full border border-line-strong bg-card p-1 text-sm">
          {(["monthly", "yearly"] as const).map((i) => (
            <button
              key={i}
              onClick={() => setBilling(i)}
              className={cn(
                "rounded-full px-4 py-1.5 font-medium transition",
                interval === i ? "bg-ink text-paper" : "text-ink-soft hover:text-ink",
              )}
            >
              {i === "monthly" ? "Monthly" : "Yearly"}
              {i === "yearly" && <span className={cn("ml-1.5 text-xs", interval === i ? "text-lime" : "text-brand")}>2+ months free</span>}
            </button>
          ))}
        </div>
        <CurrencyPicker value={currency} onChange={setCurrency} />
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((p) => {
          const pp = p.price[currency];
          const price = interval === "yearly" ? pp.yearly : pp.monthly;
          return (
            <div
              key={p.id}
              className={cn(
                "relative flex flex-col rounded-2xl border p-6",
                p.highlight ? "border-ink bg-ink text-paper shadow-2xl" : "border-line-strong bg-card",
              )}
            >
              {p.highlight && (
                <span className="absolute -top-3 left-6 rounded-full bg-lime px-2.5 py-0.5 text-xs font-semibold text-ink">
                  Most popular
                </span>
              )}
              <h3 className="text-lg font-semibold">{p.name}</h3>
              <p className={cn("mt-1 text-sm", p.highlight ? "text-paper/60" : "text-muted")}>{p.tagline}</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight">{fmt(price)}</span>
                {p.id !== "free" && <span className={cn("text-sm", p.highlight ? "text-paper/60" : "text-muted")}>/mo</span>}
              </div>
              <p className={cn("mt-1 h-4 text-xs", p.highlight ? "text-paper/50" : "text-muted")}>
                {p.id === "free"
                  ? "Forever. No card."
                  : interval === "yearly"
                    ? `Billed ${fmt(pp.yearly * 12)} yearly · ${perPage(pp.yearly / p.pages)}/page`
                    : `${perPage(pp.monthly / p.pages)} per page`}
              </p>
              <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check className={cn("mt-0.5 size-4 shrink-0", p.highlight ? "text-lime" : "text-brand")} />
                    <span className={p.highlight ? "text-paper/85" : "text-ink-soft"}>{f}</span>
                  </li>
                ))}
              </ul>
              {p.id === "free" ? (
                <Link href="/convert" className={btn("outline", "md", "mt-8 w-full")}>
                  Start free
                </Link>
              ) : (
                <button
                  onClick={() => checkout(p.id)}
                  disabled={loading !== null}
                  className={btn(p.highlight ? "lime" : "primary", "md", "mt-8 w-full")}
                >
                  {loading === p.id ? "Opening checkout…" : `Get ${p.name}`}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-col items-center justify-between gap-3 rounded-2xl border border-dashed border-line-strong bg-card/60 px-6 py-4 text-sm sm:flex-row">
        <p className="text-ink-soft">
          <span className="font-semibold text-ink">Just need a one-off?</span> Buy {PAGE_PACK.pages} pages for {fmt(PAGE_PACK.price[currency])}. They never
          expire.
        </p>
        <button onClick={() => checkout("pack")} disabled={loading !== null} className={btn("outline", "sm")}>
          {loading === "pack" ? "Opening…" : `Buy ${PAGE_PACK.pages} pages`}
        </button>
      </div>
      {error && <p className="mt-4 text-center text-sm text-danger">{error}</p>}
    </section>
  );
}
