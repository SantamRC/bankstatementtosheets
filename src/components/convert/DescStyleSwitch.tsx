"use client";
import { Wand2 } from "lucide-react";
import { setDescStyle, useDescStyle } from "@/lib/prefs";
import { cn } from "@/lib/ui";

/** Highlighted on/off switch: off = descriptions exactly as the bank printed them (default), on = clean payee names. */
export function DescStyleSwitch({ tone = "light", className }: { tone?: "light" | "dark"; className?: string }) {
  const clean = useDescStyle() === "clean";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={clean}
      onClick={() => setDescStyle(clean ? "original" : "clean")}
      title={
        clean
          ? "Showing short payee names. The bank's full description is kept in its own column. Click to show the bank's original text."
          : "Showing descriptions exactly as printed by the bank. Click to switch to short, clean payee names."
      }
      className={cn(
        "group inline-flex h-9 shrink-0 items-center gap-2.5 rounded-lg border-2 border-lime bg-lime/35 px-3 text-sm font-semibold text-ink shadow-[0_0_0_3px_rgba(200,242,90,0.25)] transition hover:bg-lime/60",
        tone === "dark" && "bg-lime/90 hover:bg-lime",
        className,
      )}
    >
      <Wand2 className="size-4" />
      <span>Clean payee names</span>
      <span
        aria-hidden
        className={cn(
          "relative h-5 w-9 rounded-full border border-ink/20 transition-colors",
          clean ? "bg-brand" : "bg-white",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-3.5 rounded-full shadow transition-transform",
            clean ? "translate-x-4 bg-white" : "bg-ink/40",
          )}
        />
      </span>
      <span className="w-6 text-left text-xs font-bold uppercase">{clean ? "On" : "Off"}</span>
    </button>
  );
}
