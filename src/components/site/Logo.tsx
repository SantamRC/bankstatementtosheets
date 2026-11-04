import Link from "next/link";

export function LogoMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="8" fill="#0d1512" />
      <path d="M8 11h16M8 16h16M8 21h9M14 8v16" stroke="#f7f6f1" strokeOpacity=".35" strokeWidth="1.5" />
      <path d="M18.5 21.5l2.5 2.5 4.5-5.5" stroke="#c8f25a" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight text-ink" aria-label="BankStatementToSheets home">
      <LogoMark />
      <span className="text-[15px]">
        BankStatement<span className="text-muted">To</span>Sheets
      </span>
    </Link>
  );
}
