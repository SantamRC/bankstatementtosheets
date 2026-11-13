"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  FileText,
  Layers,
  Loader2,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";
import type { ExtractEvent, Statement, Transaction } from "@/lib/extraction/schema";
import { reconcile } from "@/lib/extraction/reconcile";
import { SAMPLE_STATEMENT } from "@/lib/sample";
import { FREE_PAGES } from "@/lib/plans";
import { Dropzone } from "./Dropzone";
import { ReviewTable } from "./ReviewTable";
import { ExportBar } from "./ExportBar";
import { btn, cn, money } from "@/lib/ui";

type JobStatus = "queued" | "uploading" | "extracting" | "done" | "error";
interface Job {
  id: string;
  name: string;
  size: number;
  file?: File;
  status: JobStatus;
  progress: { done: number; total: number } | null;
  pages?: number;
  error?: { code: string; message: string };
  statement?: Statement;
}

const STORAGE_KEY = "bsts:workspace:v1";
const CONCURRENT = 2;

export function Workspace({
  signedIn,
  authEnabled,
  initialPages,
  initialStatement,
}: {
  signedIn: boolean;
  authEnabled: boolean;
  initialPages: number | null;
  initialStatement?: Statement | null;
}) {
  const fromProps: Job | null = initialStatement
    ? { id: initialStatement.id, name: initialStatement.fileName, size: 0, status: "done", progress: null, pages: initialStatement.pages, statement: initialStatement }
    : null;
  const [jobs, setJobs] = useState<Job[]>(fromProps ? [fromProps] : []);
  const [active, setActive] = useState<string | "all" | null>(fromProps?.id ?? null);
  const [pagesLeft, setPagesLeft] = useState<number | null>(initialPages);
  const running = useRef(new Set<string>());

  // Restore the last session from sessionStorage (survives refresh and the Google sign-in popup).
  useEffect(() => {
    if (initialStatement) return;
    let list: Job[] = [];
    try {
      list = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "[]") as Job[];
    } catch {}
    if (list.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrating from browser storage
      setJobs(list);
      setActive(list[0].id);
    }
  }, [initialStatement]);

  useEffect(() => {
    try {
      const done = jobs.filter((j) => j.status === "done").map((j) => ({ ...j, file: undefined }));
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(done));
    } catch {}
  }, [jobs]);

  const update = useCallback((id: string, patch: Partial<Job>) => {
    setJobs((js) => js.map((j) => (j.id === id ? { ...j, ...patch } : j)));
  }, []);

  const process = useCallback(
    async (job: Job) => {
      if (!job.file) return;
      running.current.add(job.id);
      update(job.id, { status: "uploading", error: undefined, progress: null });
      try {
        const body = new FormData();
        body.append("file", job.file);
        const res = await fetch("/api/extract", { method: "POST", body });
        if (!res.body || !res.headers.get("content-type")?.includes("ndjson")) {
          const j = (await res.json().catch(() => null)) as Extract<ExtractEvent, { type: "error" }> | null;
          update(job.id, { status: "error", error: { code: j?.code ?? "http", message: j?.message ?? `Upload failed (${res.status}).` } });
          return;
        }
        update(job.id, { status: "extracting" });
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        let finished = false;
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let nl: number;
          while ((nl = buf.indexOf("\n")) >= 0) {
            const line = buf.slice(0, nl).trim();
            buf = buf.slice(nl + 1);
            if (!line) continue;
            const ev = JSON.parse(line) as ExtractEvent;
            if (ev.type === "start") update(job.id, { pages: ev.pages, progress: { done: 0, total: ev.chunks } });
            else if (ev.type === "progress") update(job.id, { progress: { done: ev.done, total: ev.total } });
            else if (ev.type === "result") {
              finished = true;
              update(job.id, { status: "done", statement: ev.statement, file: undefined });
              if (ev.pagesRemaining != null) setPagesLeft(ev.pagesRemaining);
              setActive((a) => (a == null || a === job.id ? job.id : a));
            } else if (ev.type === "error") {
              finished = true;
              update(job.id, { status: "error", error: { code: ev.code, message: ev.message } });
            }
          }
        }
        if (!finished) update(job.id, { status: "error", error: { code: "stream", message: "Connection dropped. Please retry." } });
      } catch {
        update(job.id, { status: "error", error: { code: "network", message: "Network error. Please retry." } });
      } finally {
        running.current.delete(job.id);
      }
    },
    [update],
  );

  // Simple queue: keep CONCURRENT jobs in flight.
  useEffect(() => {
    const inFlight = running.current.size;
    const next = jobs.filter((j) => j.status === "queued" && !running.current.has(j.id)).slice(0, Math.max(0, CONCURRENT - inFlight));
    next.forEach((j) => process(j));
  }, [jobs, process]);

  const addFiles = (files: File[]) => {
    const newJobs: Job[] = files.map((f) => ({ id: crypto.randomUUID(), name: f.name, size: f.size, file: f, status: "queued", progress: null }));
    setJobs((js) => [...js.filter((j) => j.id !== "sample"), ...newJobs]);
    setActive((a) => (a && a !== "sample" ? a : newJobs[0].id));
  };

  const loadSample = () => {
    setJobs((js) => [{ id: "sample", name: SAMPLE_STATEMENT.fileName, size: 0, status: "done", progress: null, pages: 3, statement: SAMPLE_STATEMENT }, ...js.filter((j) => j.id !== "sample")]);
    setActive("sample");
  };

  const retry = (id: string) => update(id, { status: "queued", error: undefined });
  const remove = (id: string) => {
    setJobs((js) => js.filter((j) => j.id !== id));
    setActive((a) => (a === id ? null : a));
  };

  const editStatement = useCallback(
    (jobId: string, edit: (rows: Transaction[]) => Transaction[]) => {
      setJobs((js) =>
        js.map((j) => {
          if (j.id !== jobId || !j.statement) return j;
          const s = j.statement;
          const { transactions, reconciliation } = reconcile(edit(s.transactions), s.openingBalance, s.closingBalance, {
            reorder: false,
            allowAutoFix: false,
            direction: s.reconciliation.direction,
            accountType: s.accountType,
          });
          return { ...j, statement: { ...s, transactions, reconciliation: { ...reconciliation, reversedOrder: s.reconciliation.reversedOrder } } };
        }),
      );
    },
    [],
  );

  const done = jobs.filter((j) => j.status === "done" && j.statement);
  const doneStatements = useMemo(() => done.map((j) => j.statement!), [done]);
  const effectiveActive = active ?? done[0]?.id ?? jobs[0]?.id ?? null;
  const activeJob = jobs.find((j) => j.id === effectiveActive);

  /* ---------------- Empty state ---------------- */
  if (jobs.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Convert a statement <span className="font-serif font-normal italic text-brand">in seconds.</span>
          </h1>
          <p className="mt-3 text-ink-soft">PDF in, verified spreadsheet out. Digital or scanned, any bank.</p>
        </div>
        <div className="mt-8">
          {authEnabled && !signedIn ? (
            <SignInGate onSample={loadSample} />
          ) : (
            <>
              <Dropzone onFiles={addFiles} />
              <div className="mt-4 flex flex-col items-center justify-between gap-3 text-sm sm:flex-row">
                <PagesPill pagesLeft={pagesLeft} />
                <button onClick={loadSample} className="inline-flex items-center gap-1.5 font-medium text-brand hover:underline">
                  <Sparkles className="size-4" /> No statement handy? Try a sample
                </button>
              </div>
            </>
          )}
        </div>
        <ul className="mt-12 grid gap-4 text-sm sm:grid-cols-3">
          {[
            [<ShieldCheck key="a" className="size-4" />, "Balance-verified", "Each row is checked against the printed running balance."],
            [<Wand2 key="b" className="size-4" />, "Self-correcting", "Swapped debits/credits are detected and fixed for you."],
            [<Layers key="c" className="size-4" />, "Batch & merge", "Drop a year of statements and export one combined sheet."],
          ].map(([icon, title, body]) => (
            <li key={title as string} className="rounded-xl border border-line bg-card p-4">
              <div className="flex items-center gap-2 font-semibold text-ink">
                <span className="text-brand">{icon}</span>
                {title}
              </div>
              <p className="mt-1 text-muted">{body}</p>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  /* ---------------- Working state ---------------- */
  const showAll = effectiveActive === "all" && doneStatements.length > 1;
  return (
    <div className="mx-auto grid max-w-[1400px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[280px_1fr]">
      <aside className="space-y-3 lg:sticky lg:top-20 lg:self-start">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold">Statements</h2>
          <PagesPill pagesLeft={pagesLeft} small />
        </div>
        <div className="space-y-1.5">
          {doneStatements.length > 1 && (
            <button
              onClick={() => setActive("all")}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition",
                showAll ? "border-ink bg-ink text-paper" : "border-line bg-card hover:border-line-strong",
              )}
            >
              <Layers className="size-4 shrink-0" />
              <span className="font-medium">All statements merged</span>
              <span className={cn("num ml-auto text-xs", showAll ? "text-paper/60" : "text-muted")}>
                {doneStatements.reduce((n, s) => n + s.transactions.length, 0)}
              </span>
            </button>
          )}
          {jobs.map((j) => (
            <JobItem key={j.id} job={j} active={j.id === effectiveActive} onSelect={() => setActive(j.id)} onRetry={() => retry(j.id)} onRemove={() => remove(j.id)} />
          ))}
        </div>
        {(!authEnabled || signedIn) && <Dropzone onFiles={addFiles} compact />}
      </aside>

      <section className="min-w-0">
        {showAll ? (
          <MergedView statements={doneStatements} />
        ) : activeJob?.statement ? (
          <StatementView
            statement={activeJob.statement}
            onPatch={(id, patch) => editStatement(activeJob.id, (rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)))}
            onDelete={(id) => editStatement(activeJob.id, (rows) => rows.filter((r) => r.id !== id))}
            isSample={activeJob.id === "sample"}
            signedIn={signedIn || !authEnabled}
          />
        ) : activeJob ? (
          <ProcessingView job={activeJob} onRetry={() => retry(activeJob.id)} />
        ) : null}
      </section>
    </div>
  );
}

/* ---------------- Pieces ---------------- */

function PagesPill({ pagesLeft, small }: { pagesLeft: number | null; small?: boolean }) {
  if (pagesLeft == null) return <span />;
  return (
    <Link
      href="/pricing"
      className={cn(
        "num inline-flex items-center gap-1.5 rounded-full border border-line bg-card font-medium text-ink-soft hover:border-ink",
        small ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs",
        pagesLeft < 5 && "border-warn/40 text-warn",
      )}
    >
      {pagesLeft} pages left
    </Link>
  );
}

function SignInGate({ onSample }: { onSample: () => void }) {
  return (
    <div className="rounded-2xl border border-line-strong bg-card p-8 text-center sm:p-12">
      <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-ink text-lime">
        <ShieldCheck className="size-6" />
      </div>
      <h2 className="mt-5 text-xl font-semibold">Create a free account to convert</h2>
      <p className="mx-auto mt-2 max-w-md text-ink-soft">
        You get {FREE_PAGES} pages free — no credit card. An account keeps your conversions private to you and lets you re-download them later.
      </p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/login?next=/convert" className={btn("primary", "lg")}>
          Sign up free <ArrowRight className="size-4" />
        </Link>
        <button onClick={onSample} className={btn("outline", "lg")}>
          <Sparkles className="size-4" /> Explore a sample first
        </button>
      </div>
    </div>
  );
}

function JobItem({ job, active, onSelect, onRetry, onRemove }: { job: Job; active: boolean; onSelect: () => void; onRetry: () => void; onRemove: () => void }) {
  const s = job.statement;
  const status = s?.reconciliation.status;
  return (
    <div
      className={cn(
        "group relative flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition",
        active ? "border-ink bg-card shadow-sm" : "border-line bg-card/60 hover:border-line-strong",
      )}
    >
      <button onClick={onSelect} className="absolute inset-0 rounded-xl" aria-label={`Open ${job.name}`} />
      <div className="relative grid size-8 shrink-0 place-items-center rounded-lg bg-paper">
        {job.status === "done" ? (
          status === "verified" ? <Check className="size-4 text-brand" strokeWidth={3} /> : status === "mismatch" ? <AlertTriangle className="size-4 text-warn" /> : <FileText className="size-4 text-muted" />
        ) : job.status === "error" ? (
          <AlertTriangle className="size-4 text-danger" />
        ) : (
          <Loader2 className="size-4 animate-spin text-brand" />
        )}
      </div>
      <div className="pointer-events-none relative min-w-0 flex-1">
        <p className="truncate font-medium">{s?.bankName ?? job.name}</p>
        <p className="truncate text-xs text-muted">
          {job.status === "done" && s
            ? `${s.transactions.length} transactions · ${s.pages} pages`
            : job.status === "error"
              ? "Failed"
              : job.status === "queued"
                ? "Queued"
                : job.progress
                  ? `Reading… ${job.progress.done}/${job.progress.total} parts`
                  : "Uploading…"}
        </p>
      </div>
      {job.status === "error" && (
        <button onClick={onRetry} className="relative grid size-7 place-items-center rounded-md text-muted hover:bg-paper hover:text-ink" aria-label="Retry">
          <RotateCcw className="size-3.5" />
        </button>
      )}
      <button
        onClick={onRemove}
        className="relative grid size-7 place-items-center rounded-md text-muted opacity-0 transition group-hover:opacity-100 hover:bg-paper hover:text-ink focus:opacity-100"
        aria-label="Remove"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

function ProcessingView({ job, onRetry }: { job: Job; onRetry: () => void }) {
  if (job.status === "error") {
    const outOfPages = job.error?.code === "out_of_pages";
    return (
      <div className="rounded-2xl border border-line-strong bg-card p-10 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-danger-soft">
          <AlertTriangle className="size-5 text-danger" />
        </div>
        <h2 className="mt-4 text-lg font-semibold">{outOfPages ? "You're out of pages" : "We couldn't convert this file"}</h2>
        <p className="mx-auto mt-2 max-w-md text-ink-soft">{job.error?.message}</p>
        <div className="mt-6 flex justify-center gap-3">
          {outOfPages ? (
            <Link href="/pricing" className={btn("brand", "md")}>See plans</Link>
          ) : job.error?.code === "auth_required" ? (
            <Link href="/login?next=/convert" className={btn("primary", "md")}>Sign in</Link>
          ) : job.file ? (
            <button onClick={onRetry} className={btn("primary", "md")}>
              <RotateCcw className="size-4" /> Try again
            </button>
          ) : null}
        </div>
      </div>
    );
  }
  const pct = job.progress && job.progress.total ? Math.max(8, (job.progress.done / job.progress.total) * 100) : job.status === "extracting" ? 8 : 3;
  const steps = [
    ["Uploading securely", job.status !== "queued"],
    ["Reading pages with AI", job.status === "extracting"],
    ["Reconciling running balances", job.progress != null && job.progress.done === job.progress.total],
  ] as const;
  return (
    <div className="rounded-2xl border border-line-strong bg-card p-8 sm:p-10">
      <div className="flex items-center gap-3">
        <FileText className="size-5 text-muted" />
        <p className="truncate font-medium">{job.name}</p>
        {job.pages && <span className="num ml-auto shrink-0 text-sm text-muted">{job.pages} pages</span>}
      </div>
      <div className="mt-6 h-2 overflow-hidden rounded-full bg-paper">
        <div className="h-full rounded-full bg-brand transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
      <ul className="mt-6 space-y-3 text-sm">
        {steps.map(([label, on]) => (
          <li key={label} className={cn("flex items-center gap-2.5", on ? "text-ink" : "text-muted")}>
            {on ? <Loader2 className="size-4 animate-spin text-brand" /> : <span className="size-4 rounded-full border border-line-strong" />}
            {label}
          </li>
        ))}
      </ul>
      <div className="mt-8 space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-9 rounded-lg" style={{ opacity: 1 - i * 0.13 }} />
        ))}
      </div>
      <p className="mt-6 text-xs text-muted">Typically 10–40 seconds. Longer statements are split and read in parallel.</p>
    </div>
  );
}

function VerificationBanner({ s }: { s: Statement }) {
  const r = s.reconciliation;
  const config = {
    verified: {
      cls: "border-brand/25 bg-brand-soft text-brand-dark",
      icon: <ShieldCheck className="size-5" />,
      title: "Balances verified",
      body: `All ${s.transactions.length} transactions reconcile with the statement’s running balance${s.closingBalance != null ? " and closing balance" : ""}.`,
    },
    partial: {
      cls: "border-line-strong bg-card text-ink",
      icon: <ShieldCheck className="size-5 text-brand" />,
      title: `${r.verifiedRows + r.fixedRows} of ${s.transactions.length} rows verified`,
      body: "Some rows have no printed balance to check against. Everything that could be checked ties out.",
    },
    mismatch: {
      cls: "border-warn/30 bg-warn-soft text-warn",
      icon: <AlertTriangle className="size-5" />,
      title: r.mismatchRows ? (r.mismatchRows === 1 ? "1 row needs a quick look" : `${r.mismatchRows} rows need a quick look`) : "Totals don’t tie out",
      body:
        r.difference != null && Math.abs(r.difference) >= 0.01
          ? `${r.direction === "liability" ? "Opening + purchases − payments" : "Opening + credits − debits"} is off from the closing balance by ${money(Math.abs(r.difference))}. Check highlighted rows against the PDF (page numbers shown on hover).`
          : "Highlighted rows don’t match the printed running balance. Fix the amount and the check re-runs instantly.",
    },
    no_balances: {
      cls: "border-line-strong bg-card text-ink",
      icon: <FileText className="size-5 text-muted" />,
      title: "No balances to verify against",
      body: "This statement doesn’t print running or closing balances, so rows can’t be auto-verified. Spot-check totals before filing.",
    },
  }[r.status];

  return (
    <div className={cn("flex gap-3 rounded-2xl border p-4", config.cls)}>
      <div className="mt-0.5 shrink-0">{config.icon}</div>
      <div className="text-sm">
        <p className="font-semibold">{config.title}</p>
        <p className="mt-0.5 opacity-80">{config.body}</p>
        {r.fixedRows > 0 && (
          <p className="mt-1.5 inline-flex items-center gap-1.5 font-medium">
            <Wand2 className="size-3.5" /> {r.fixedRows} row{r.fixedRows === 1 ? " was" : "s were"} auto-corrected (swapped debit/credit).
          </p>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-line bg-card px-4 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className={cn("num mt-1 truncate text-lg font-semibold", tone)}>{value || "—"}</p>
    </div>
  );
}

function StatementView({
  statement: s,
  onPatch,
  onDelete,
  isSample,
  signedIn,
}: {
  statement: Statement;
  onPatch: (id: string, patch: Partial<Transaction>) => void;
  onDelete: (id: string) => void;
  isSample: boolean;
  signedIn: boolean;
}) {
  const cur = s.currency;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide text-muted uppercase">
            {[s.accountType?.replace("_", " "), s.accountLast4 && `•••• ${s.accountLast4}`, cur].filter(Boolean).join(" · ") || s.fileName}
          </p>
          <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight">{s.bankName ?? s.fileName}</h1>
          <p className="mt-0.5 text-sm text-ink-soft">
            {s.accountHolder ? `${s.accountHolder} · ` : ""}
            {s.periodStart && s.periodEnd ? `${s.periodStart} → ${s.periodEnd}` : `${s.pages} pages`}
          </p>
        </div>
      </div>

      {isSample && (
        <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-brand/40 bg-brand-soft/50 p-4 text-sm sm:flex-row sm:items-center">
          <Sparkles className="size-5 shrink-0 text-brand" />
          <p className="text-ink-soft">
            <span className="font-semibold text-ink">This is a sample.</span> Try editing an amount — the balance check re-runs live. Then export it to see the
            Excel output.
          </p>
          {!signedIn && (
            <Link href="/login?next=/convert" className={btn("brand", "sm", "sm:ml-auto")}>
              Convert my own <ArrowRight className="size-3.5" />
            </Link>
          )}
        </div>
      )}

      <VerificationBanner s={s} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Opening balance" value={money(s.openingBalance, cur)} />
        <Stat label="Money in" value={money(s.reconciliation.totalCredits, cur)} tone="text-brand" />
        <Stat label="Money out" value={money(s.reconciliation.totalDebits, cur)} />
        <Stat label="Closing balance" value={money(s.closingBalance, cur)} />
      </div>

      {s.notes.length > 0 && (
        <details className="rounded-xl border border-line bg-card px-4 py-3 text-sm">
          <summary className="cursor-pointer font-medium text-ink-soft">Notes from extraction ({s.notes.length})</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
            {s.notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </details>
      )}

      <ReviewTable rows={s.transactions} onPatch={onPatch} onDelete={onDelete} />
      <ExportBar statements={[s]} scopeLabel={`${s.transactions.length} transactions`} />
    </div>
  );
}

function MergedView({ statements }: { statements: Statement[] }) {
  const total = statements.reduce((n, s) => n + s.transactions.length, 0);
  const verified = statements.filter((s) => s.reconciliation.status === "verified").length;
  const currencies = [...new Set(statements.map((s) => s.currency).filter(Boolean))];
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium tracking-wide text-muted uppercase">Merged export</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{statements.length} statements · {total} transactions</h1>
      </div>
      {currencies.length > 1 && (
        <div className="flex gap-3 rounded-2xl border border-warn/30 bg-warn-soft p-4 text-sm text-warn">
          <AlertTriangle className="size-5 shrink-0" />
          These statements use different currencies ({currencies.join(", ")}). Totals in the Categories sheet will mix them.
        </div>
      )}
      <div className="overflow-hidden rounded-2xl border border-line-strong bg-card">
        <table className="w-full text-sm">
          <thead className="bg-paper text-left text-[11px] tracking-wide text-muted uppercase">
            <tr>
              <th className="px-4 py-2.5 font-medium">Statement</th>
              <th className="px-4 py-2.5 font-medium">Period</th>
              <th className="px-4 py-2.5 text-right font-medium">Rows</th>
              <th className="px-4 py-2.5 font-medium">Verification</th>
            </tr>
          </thead>
          <tbody>
            {statements.map((s) => (
              <tr key={s.id} className="border-t border-line/70">
                <td className="px-4 py-3 font-medium">{s.bankName ?? s.fileName}</td>
                <td className="num px-4 py-3 text-muted">{s.periodStart && s.periodEnd ? `${s.periodStart} → ${s.periodEnd}` : "—"}</td>
                <td className="num px-4 py-3 text-right">{s.transactions.length}</td>
                <td className="px-4 py-3">
                  {s.reconciliation.status === "verified" ? (
                    <span className="inline-flex items-center gap-1.5 font-medium text-brand"><Check className="size-4" strokeWidth={3} /> Verified</span>
                  ) : s.reconciliation.status === "mismatch" ? (
                    <span className="inline-flex items-center gap-1.5 font-medium text-warn"><AlertTriangle className="size-4" /> Needs review</span>
                  ) : (
                    <span className="text-muted">Partially verified</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-muted">
        {verified} of {statements.length} statements fully verified. The export adds a <span className="font-medium text-ink">Source</span> column so you can
        filter by statement.
      </p>
      <ExportBar statements={statements} scopeLabel={`all ${statements.length} statements`} />
    </div>
  );
}
