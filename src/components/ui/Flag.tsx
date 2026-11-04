import type { Currency } from "@/lib/plans";

/** Tiny inline SVG flags (emoji flags render as letters on Windows). 4:3 viewBox. */
export function Flag({ currency, className = "h-3.5 w-[18px]" }: { currency: Currency; className?: string }) {
  return (
    <span className={`inline-block shrink-0 overflow-hidden rounded-[3px] ring-1 ring-black/10 ${className}`} aria-hidden>
      {currency === "USD" && <US />}
      {currency === "EUR" && <EU />}
      {currency === "INR" && <IN />}
    </span>
  );
}

function US() {
  return (
    <svg viewBox="0 0 24 18" className="block size-full" preserveAspectRatio="none">
      <rect width="24" height="18" fill="#fff" />
      {[0, 2, 4, 6, 8, 10, 12].map((i) => (
        <rect key={i} y={(i * 18) / 13} width="24" height={18 / 13} fill="#b22234" />
      ))}
      <rect width="10.5" height={(18 / 13) * 7} fill="#3c3b6e" />
      {[1.6, 4, 6.4, 8.8].flatMap((x, i) =>
        [1.5, 4, 6.5, 9].map((y) => <circle key={`${x}-${y}`} cx={x + (i % 2 ? 0.4 : 0)} cy={y - 0.2} r="0.55" fill="#fff" />),
      )}
    </svg>
  );
}

function EU() {
  const stars = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    return { x: 12 + Math.cos(a) * 5, y: 9 + Math.sin(a) * 5 };
  });
  return (
    <svg viewBox="0 0 24 18" className="block size-full" preserveAspectRatio="none">
      <rect width="24" height="18" fill="#003399" />
      {stars.map((s, i) => (
        <circle key={i} cx={s.x.toFixed(2)} cy={s.y.toFixed(2)} r="0.85" fill="#ffcc00" />
      ))}
    </svg>
  );
}

function IN() {
  return (
    <svg viewBox="0 0 24 18" className="block size-full" preserveAspectRatio="none">
      <rect width="24" height="6" fill="#ff9933" />
      <rect y="6" width="24" height="6" fill="#fff" />
      <rect y="12" width="24" height="6" fill="#138808" />
      <circle cx="12" cy="9" r="2.3" fill="none" stroke="#000080" strokeWidth="0.6" />
      <circle cx="12" cy="9" r="0.5" fill="#000080" />
    </svg>
  );
}
