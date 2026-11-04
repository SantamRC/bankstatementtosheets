"use client";
import { useRef, useState } from "react";
import { FileUp, Lock } from "lucide-react";
import { cn } from "@/lib/ui";

export function Dropzone({
  onFiles,
  compact = false,
  disabled = false,
}: {
  onFiles: (files: File[]) => void;
  compact?: boolean;
  disabled?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const accept = (list: FileList | null) => {
    if (!list) return;
    const files = Array.from(list).filter((f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
    if (files.length) onFiles(files);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-disabled={disabled}
      onClick={() => !disabled && input.current?.click()}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && !disabled && input.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (!disabled) accept(e.dataTransfer.files);
      }}
      className={cn(
        "group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed text-center transition-all",
        compact ? "gap-1 px-4 py-5" : "gap-3 px-6 py-16 sm:py-20",
        over ? "scale-[1.01] border-brand bg-brand-soft" : "border-line-strong bg-card hover:border-ink/40 hover:bg-white",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <input
        ref={input}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        className="hidden"
        onChange={(e) => {
          accept(e.target.files);
          e.target.value = "";
        }}
      />
      <div
        className={cn(
          "grid place-items-center rounded-2xl bg-ink text-lime transition group-hover:-translate-y-0.5",
          compact ? "size-9" : "size-14",
        )}
      >
        <FileUp className={compact ? "size-4" : "size-6"} />
      </div>
      {compact ? (
        <p className="text-sm font-medium">Add more statements</p>
      ) : (
        <>
          <p className="text-lg font-semibold">Drop PDF statements here</p>
          <p className="text-sm text-muted">or click to browse · multiple files OK · up to 25 MB each</p>
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted">
            <Lock className="size-3" /> Processed in memory. Never stored.
          </p>
        </>
      )}
    </div>
  );
}
