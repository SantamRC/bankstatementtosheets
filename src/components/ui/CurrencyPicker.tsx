"use client";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { CURRENCIES, type Currency } from "@/lib/plans";
import { Flag } from "./Flag";
import { cn } from "@/lib/ui";

/** Accessible listbox-style currency dropdown with flags. */
export function CurrencyPicker({ value, onChange }: { value: Currency; onChange: (c: Currency) => void }) {
  const [open, setOpen] = useState(false);
  const [focus, setFocus] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const current = CURRENCIES.find((c) => c.code === value) ?? CURRENCIES[0];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const openMenu = () => {
    setFocus(Math.max(0, CURRENCIES.findIndex((c) => c.code === value)));
    setOpen(true);
  };
  const choose = (c: Currency) => {
    onChange(c);
    setOpen(false);
    button.current?.focus();
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocus((f) => (f + 1) % CURRENCIES.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocus((f) => (f - 1 + CURRENCIES.length) % CURRENCIES.length);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose(CURRENCIES[focus].code);
    } else if (e.key === "Tab") setOpen(false);
  };

  return (
    <div ref={root} className="relative" onKeyDown={onKey}>
      <button
        ref={button}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Currency: ${current.label}`}
        onClick={() => (open ? setOpen(false) : openMenu())}
        className="inline-flex h-[42px] items-center gap-2 rounded-full border border-line-strong bg-card pr-3 pl-4 text-sm font-medium text-ink outline-none hover:border-ink focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        <Flag currency={current.code} />
        <span>
          {current.symbol} {current.code}
        </span>
        <ChevronDown className={cn("size-4 text-muted transition", open && "rotate-180")} />
      </button>
      {open && (
        <ul
          role="listbox"
          aria-activedescendant={`currency-${CURRENCIES[focus].code}`}
          className="absolute top-full right-0 z-30 mt-2 w-64 animate-rise overflow-hidden rounded-2xl border border-line-strong bg-card p-1.5 shadow-xl [animation-duration:150ms]"
        >
          {CURRENCIES.map((c, i) => (
            <li
              key={c.code}
              id={`currency-${c.code}`}
              role="option"
              aria-selected={c.code === value}
              onMouseEnter={() => setFocus(i)}
              onClick={() => choose(c.code)}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm",
                i === focus ? "bg-paper" : "",
              )}
            >
              <Flag currency={c.code} className="h-4 w-[21px]" />
              <span className="flex-1 whitespace-nowrap">
                <span className="font-medium text-ink">{c.label}</span>
                <span className="ml-1.5 text-muted">
                  {c.symbol} {c.code}
                </span>
              </span>
              {c.code === value && <Check className="size-4 text-brand" strokeWidth={2.5} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
