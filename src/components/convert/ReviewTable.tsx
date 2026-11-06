"use client";
import { memo, useMemo, useState } from "react";
import { AlertTriangle, Check, CircleDashed, Search, Trash2, Wand2 } from "lucide-react";
import { CATEGORIES, type Category, type Transaction } from "@/lib/extraction/schema";
import { cn } from "@/lib/ui";
import { cleanDescription } from "@/lib/export/build";
import { setDescStyle, useDescStyle } from "@/lib/prefs";

type Patch = Partial<Pick<Transaction, "date" | "description" | "payee" | "debit" | "credit" | "balance" | "category">>;

const parseNum = (s: string): number | null => {
  const t = s.replace(/[^\d.\-]/g, "");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
};
const fmt = (n: number | null) =>
  n == null ? "" : n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function ReviewTable({
  rows,
  onPatch,
  onDelete,
}: {
  rows: Transaction[];
  onPatch: (id: string, patch: Patch) => void;
  onDelete: (id: string) => void;
}) {
  const [q, setQ] = useState("");
  const [onlyFlagged, setOnlyFlagged] = useState(false);
  const style = useDescStyle();
  const flagged = rows.filter((r) => r.status === "mismatch" || r.status === "fixed").length;

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (!onlyFlagged || r.status === "mismatch" || r.status === "fixed") &&
        (!needle ||
          [r.description, r.payee, r.reference, r.category, r.date].some((v) => v?.toLowerCase().includes(needle))),
    );
  }, [rows, q, onlyFlagged]);

  return (
    <div className="overflow-hidden rounded-2xl border border-line-strong bg-card">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2.5">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search description, category or date"
            className="h-9 w-full rounded-lg bg-paper pr-3 pl-8 text-sm outline-none placeholder:text-muted focus:ring-2 focus:ring-brand/30"
          />
        </div>
        <button
          onClick={() => setOnlyFlagged((v) => !v)}
          disabled={flagged === 0}
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition disabled:opacity-40",
            onlyFlagged ? "bg-warn-soft text-warn" : "bg-paper text-ink-soft hover:text-ink",
          )}
        >
          <AlertTriangle className="size-4" /> Flagged ({flagged})
        </button>
        <div role="radiogroup" aria-label="Descriptions" className="inline-flex h-9 items-center rounded-lg bg-paper p-0.5 text-sm">
          {(
            [
              ["clean", "Clean"],
              ["original", "Bank original"],
            ] as const
          ).map(([v, text]) => (
            <button
              key={v}
              role="radio"
              aria-checked={style === v}
              onClick={() => setDescStyle(v)}
              className={cn(
                "h-8 rounded-md px-2.5 font-medium transition",
                style === v ? "bg-card text-ink shadow-sm" : "text-ink-soft hover:text-ink",
              )}
            >
              {text}
            </button>
          ))}
        </div>
        <span className="num ml-auto hidden text-xs text-muted sm:block">
          {visible.length} of {rows.length} rows
        </span>
      </div>

      <div className="max-h-[62vh] overflow-auto">
        <table className="w-full min-w-[860px] border-separate border-spacing-0 text-sm">
          <thead className="sticky top-0 z-10 bg-paper text-left text-[11px] tracking-wide text-muted uppercase">
            <tr>
              <th className="w-10 border-b border-line px-3 py-2.5" />
              <th className="w-[118px] border-b border-line px-2 py-2.5 font-medium">Date</th>
              <th className="border-b border-line px-2 py-2.5 font-medium">Description</th>
              <th className="w-[150px] border-b border-line px-2 py-2.5 font-medium">Category</th>
              <th className="w-[112px] border-b border-line px-2 py-2.5 text-right font-medium">Debit</th>
              <th className="w-[112px] border-b border-line px-2 py-2.5 text-right font-medium">Credit</th>
              <th className="w-[122px] border-b border-line px-2 py-2.5 text-right font-medium">Balance</th>
              <th className="w-10 border-b border-line" />
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <Row key={r.id} row={r} clean={style === "clean"} onPatch={onPatch} onDelete={onDelete} />
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-14 text-center text-muted">
                  No rows match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const cellInput =
  "w-full rounded-md bg-transparent px-2 py-1.5 outline-none transition hover:bg-paper focus:bg-white focus:ring-2 focus:ring-brand/40";

const Row = memo(function Row({
  row: r,
  clean,
  onPatch,
  onDelete,
}: {
  row: Transaction;
  clean: boolean;
  onPatch: (id: string, patch: Patch) => void;
  onDelete: (id: string) => void;
}) {
  const tone =
    r.status === "mismatch" ? "bg-warn-soft/70" : r.status === "fixed" ? "bg-brand-soft/40" : "hover:bg-paper/60";
  const money = (field: "debit" | "credit" | "balance", cls = "") => (
    <input
      key={`${field}-${r[field]}`}
      defaultValue={fmt(r[field])}
      inputMode="decimal"
      aria-label={field}
      onBlur={(e) => {
        const v = parseNum(e.target.value);
        if (v !== r[field]) onPatch(r.id, { [field]: v });
        else e.target.value = fmt(r[field]);
      }}
      className={cn(cellInput, "num text-right", cls)}
    />
  );

  return (
    <tr className={cn("group", tone)}>
      <td className="border-b border-line/60 px-3">
        <StatusIcon row={r} />
      </td>
      <td className="border-b border-line/60 px-1">
        <input
          key={`d-${r.date}`}
          defaultValue={r.date}
          aria-label="date"
          onBlur={(e) => e.target.value !== r.date && onPatch(r.id, { date: e.target.value.trim() })}
          className={cn(cellInput, "num text-muted")}
        />
      </td>
      <td className="border-b border-line/60 px-1">
        {clean ? (
          <input
            key={`p-${cleanDescription(r)}`}
            defaultValue={cleanDescription(r)}
            title={[r.description, r.reference && `Ref ${r.reference}`].filter(Boolean).join("\n")}
            aria-label="payee"
            onBlur={(e) => e.target.value !== cleanDescription(r) && onPatch(r.id, { payee: e.target.value })}
            className={cn(cellInput, "font-medium")}
          />
        ) : (
          <input
            key={`s-${r.description}`}
            defaultValue={r.description}
            title={r.description}
            aria-label="description"
            onBlur={(e) => e.target.value !== r.description && onPatch(r.id, { description: e.target.value })}
            className={cn(cellInput, "font-medium")}
          />
        )}
      </td>
      <td className="border-b border-line/60 px-1">
        <select
          value={r.category}
          aria-label="category"
          onChange={(e) => onPatch(r.id, { category: e.target.value as Category })}
          className={cn(cellInput, "cursor-pointer appearance-none text-ink-soft")}
        >
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </td>
      <td className="border-b border-line/60 px-1">{money("debit")}</td>
      <td className="border-b border-line/60 px-1">{money("credit", "text-brand")}</td>
      <td className="border-b border-line/60 px-1">{money("balance")}</td>
      <td className="border-b border-line/60 pr-2">
        <button
          onClick={() => onDelete(r.id)}
          aria-label="Delete row"
          className="grid size-7 place-items-center rounded-md text-muted opacity-0 transition group-hover:opacity-100 hover:bg-danger-soft hover:text-danger focus:opacity-100"
        >
          <Trash2 className="size-3.5" />
        </button>
      </td>
    </tr>
  );
});

function StatusIcon({ row }: { row: Transaction }) {
  const title =
    row.status === "verified"
      ? "Verified against the running balance"
      : row.status === "fixed"
        ? row.note ?? "Auto-corrected"
        : row.status === "mismatch"
          ? row.note ?? "Doesn't tie out to the printed balance — please check"
          : "No printed balance to check against";
  return (
    <span title={title} className="grid size-5 place-items-center">
      {row.status === "verified" && (
        <span className="grid size-4 place-items-center rounded-full bg-brand">
          <Check className="size-2.5 text-white" strokeWidth={3.5} />
        </span>
      )}
      {row.status === "fixed" && <Wand2 className="size-4 text-brand" />}
      {row.status === "mismatch" && <AlertTriangle className="size-4 text-warn" />}
      {row.status === "unchecked" && <CircleDashed className="size-4 text-muted/60" />}
    </span>
  );
}
