"use client";
import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, Check, FileText, Loader2, Trash2 } from "lucide-react";
import { btn, cn } from "@/lib/ui";

export interface ConversionRow {
  id: string;
  file_name: string;
  bank_name: string | null;
  pages: number;
  transaction_count: number;
  reconciliation_status: string | null;
  period_start: string | null;
  period_end: string | null;
  created_at: string;
}

export function BillingButton({ hasCustomer }: { hasCustomer: boolean }) {
  const [loading, setLoading] = useState(false);
  if (!hasCustomer) return <Link href="/pricing" className={btn("brand", "md")}>Upgrade</Link>;
  return (
    <button
      className={btn("outline", "md")}
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        const res = await fetch("/api/billing-portal", { method: "POST" });
        const j = await res.json();
        if (j.url) window.location.href = j.url;
        else setLoading(false);
      }}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : "Manage billing"}
    </button>
  );
}

export function ConversionList({ initial }: { initial: ConversionRow[] }) {
  const [rows, setRows] = useState(initial);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function del(id: string) {
    setDeleting(id);
    const res = await fetch(`/api/conversions/${id}`, { method: "DELETE" });
    if (res.ok) setRows((r) => r.filter((x) => x.id !== id));
    setDeleting(null);
  }

  if (!rows.length)
    return (
      <div className="rounded-2xl border border-dashed border-line-strong bg-card p-12 text-center">
        <FileText className="mx-auto size-6 text-muted" />
        <p className="mt-3 font-medium">No conversions yet</p>
        <p className="mt-1 text-sm text-muted">Your converted statements show up here for 30 days.</p>
        <Link href="/convert" className={btn("primary", "md", "mt-5")}>Convert a statement</Link>
      </div>
    );

  return (
    <div className="overflow-hidden rounded-2xl border border-line-strong bg-card">
      {rows.map((r) => (
        <div key={r.id} className="group flex items-center gap-4 border-b border-line/70 px-5 py-4 last:border-0 hover:bg-paper/50">
          <div className={cn("grid size-9 shrink-0 place-items-center rounded-lg", r.reconciliation_status === "mismatch" ? "bg-warn-soft" : "bg-brand-soft")}>
            {r.reconciliation_status === "mismatch" ? <AlertTriangle className="size-4 text-warn" /> : <Check className="size-4 text-brand" strokeWidth={3} />}
          </div>
          <Link href={`/convert?c=${r.id}`} className="min-w-0 flex-1">
            <p className="truncate font-medium">{r.bank_name ?? r.file_name}</p>
            <p className="truncate text-sm text-muted">
              {r.period_start && r.period_end ? `${r.period_start} → ${r.period_end} · ` : ""}
              {r.transaction_count} transactions · {r.pages} pages
            </p>
          </Link>
          <span className="num hidden text-xs text-muted sm:block">{new Date(r.created_at).toLocaleDateString()}</span>
          <Link href={`/convert?c=${r.id}`} className={btn("outline", "sm")}>Open</Link>
          <button
            onClick={() => del(r.id)}
            disabled={deleting === r.id}
            aria-label="Delete conversion"
            className="grid size-8 place-items-center rounded-md text-muted hover:bg-danger-soft hover:text-danger"
          >
            {deleting === r.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
          </button>
        </div>
      ))}
    </div>
  );
}
