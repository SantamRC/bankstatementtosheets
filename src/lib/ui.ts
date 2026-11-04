import clsx, { type ClassValue } from "clsx";

export const cn = (...c: ClassValue[]) => clsx(c);

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";
const variants = {
  primary: "bg-ink text-paper hover:bg-brand-dark shadow-[0_1px_0_rgba(255,255,255,0.15)_inset,0_6px_20px_-8px_rgba(13,21,18,0.5)]",
  brand: "bg-brand text-white hover:bg-brand-dark shadow-[0_6px_20px_-8px_rgba(11,110,79,0.7)]",
  lime: "bg-lime text-ink hover:brightness-95",
  outline: "border border-line-strong bg-card text-ink hover:border-ink",
  ghost: "text-ink-soft hover:text-ink hover:bg-black/[0.04]",
};
const sizes = { sm: "h-8 px-3.5 text-sm", md: "h-10 px-5 text-sm", lg: "h-12 px-6 text-[15px]" };

export const btn = (variant: keyof typeof variants = "primary", size: keyof typeof sizes = "md", extra?: string) =>
  cn(base, variants[variant], sizes[size], extra);

export const money = (n: number | null | undefined, currency?: string | null) => {
  if (n == null) return "";
  try {
    return new Intl.NumberFormat(undefined, {
      style: currency ? "currency" : "decimal",
      currency: currency ?? undefined,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
};
