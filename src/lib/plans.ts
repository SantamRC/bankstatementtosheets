export type PlanId = "free" | "starter" | "pro" | "business";
export type Interval = "monthly" | "yearly";

export type Currency = "USD" | "EUR" | "INR";

export const CURRENCIES: { code: Currency; label: string; symbol: string }[] = [
  { code: "USD", label: "US Dollar", symbol: "$" },
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "INR", label: "Indian Rupee", symbol: "₹" },
];

export const DEFAULT_CURRENCY: Currency = "USD";

export interface PlanPrice {
  monthly: number; // per month, billed monthly
  yearly: number; // per month, billed yearly
}

export interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  /**
   * Local price points (not live FX conversions): EUR uses the same numerals as USD (standard SaaS practice);
   * INR is the USD price at ~₹88/$ rounded to a ...99 price point. Yearly saves 2+ months in every currency.
   */
  price: Record<Currency, PlanPrice>;
  pages: number; // pages per month (free = one-time)
  features: string[];
  highlight?: boolean;
}

export const FREE_PAGES = 20;

/**
 * Launch pricing (set 2026-11-05). Positioned between commodity converters (~$0.01–0.04/page, no verification)
 * and DocuClipper ($29/60 pages, $159/640 pages). Anyone who subscribes before LAUNCH_OFFER.endsOn keeps their
 * price for as long as they stay subscribed — keep existing Dodo products unchanged and point the env at NEW
 * products for new customers.
 */
export const LAUNCH_OFFER = {
  active: true,
  endsOn: "2027-01-31",
  label: "Launch pricing",
};

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Try it on your own statements",
    price: { USD: { monthly: 0, yearly: 0 }, EUR: { monthly: 0, yearly: 0 }, INR: { monthly: 0, yearly: 0 } },
    pages: FREE_PAGES,
    features: [
      `${FREE_PAGES} pages, no card needed`,
      "Excel, CSV & Google Sheets export",
      "Balance verification on every row",
      "Scanned & photographed PDFs",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    tagline: "For freelancers & individuals",
    price: { USD: { monthly: 9, yearly: 7 }, EUR: { monthly: 9, yearly: 7 }, INR: { monthly: 799, yearly: 599 } },
    pages: 150,
    features: ["150 pages / month", "Everything in Free", "Batch upload & merge", "Conversion history (30 days)"],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For bookkeepers & accountants",
    price: { USD: { monthly: 29, yearly: 24 }, EUR: { monthly: 29, yearly: 24 }, INR: { monthly: 2499, yearly: 1999 } },
    pages: 600,
    highlight: true,
    features: [
      "600 pages / month",
      "Everything in Starter",
      "Auto-categorized transactions",
      "Category summary sheet with live formulas",
      "Priority processing",
    ],
  },
  {
    id: "business",
    name: "Business",
    tagline: "For firms & lending teams",
    price: { USD: { monthly: 79, yearly: 65 }, EUR: { monthly: 79, yearly: 65 }, INR: { monthly: 6999, yearly: 5499 } },
    pages: 2500,
    features: ["2,500 pages / month", "Everything in Pro", "Up to 5 team members", "API access (beta)", "Priority support"],
  },
];

export const PAGE_PACK: { pages: number; price: Record<Currency, number> } = {
  pages: 100,
  price: { USD: 10, EUR: 10, INR: 899 },
};

/** Format a whole-unit amount in the given currency, e.g. $29, €29, ₹2,499. */
export function formatPrice(amount: number, currency: Currency, fractionDigits = 0): string {
  return new Intl.NumberFormat(currency === "INR" ? "en-IN" : currency === "EUR" ? "en-IE" : "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount);
}

/** Best-guess currency from the browser's time zone / locale. Client-only. */
export function guessCurrency(): Currency {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
    const lang = navigator.language ?? "";
    if (tz === "Asia/Kolkata" || tz === "Asia/Calcutta" || /-IN$/i.test(lang)) return "INR";
    if (tz.startsWith("Europe/") && !/^Europe\/(London|Dublin|Lisbon|Zurich|Oslo|Stockholm|Copenhagen|Warsaw|Prague|Budapest|Bucharest|Sofia|Istanbul|Moscow|Kiev|Kyiv|Minsk|Belgrade)$/.test(tz))
      return "EUR";
  } catch {}
  return DEFAULT_CURRENCY;
}

export const isCurrency = (v: unknown): v is Currency => v === "USD" || v === "EUR" || v === "INR";

export const planById = (id: string) => PLANS.find((p) => p.id === id);

/** Dodo product IDs come from env so test/live modes differ only by config (DODO_PRODUCT_PRO_YEARLY, DODO_PRODUCT_PACK_100, …). */
export function dodoProductId(plan: PlanId | "pack", interval: Interval = "monthly"): string | undefined {
  if (plan === "pack") return process.env.DODO_PRODUCT_PACK_100 || undefined;
  return process.env[`DODO_PRODUCT_${plan.toUpperCase()}_${interval.toUpperCase()}`] || undefined;
}

export function planFromProductId(productId: string): PlanId | null {
  for (const p of ["starter", "pro", "business"] as const)
    for (const i of ["monthly", "yearly"] as const) if (dodoProductId(p, i) === productId) return p;
  return null;
}
