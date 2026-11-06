"use client";
import { useSyncExternalStore } from "react";
import type { DescStyle } from "@/lib/export/build";

// Per-viewer UI preference shared by the review table and the export bar.
const KEY = "bsts.descStyle";
const listeners = new Set<() => void>();

function read(): DescStyle {
  try {
    return localStorage.getItem(KEY) === "clean" ? "clean" : "original";
  } catch {
    return "original";
  }
}

export function setDescStyle(v: DescStyle) {
  try {
    localStorage.setItem(KEY, v);
  } catch {}
  listeners.forEach((l) => l());
}

export function useDescStyle(): DescStyle {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    read,
    () => "original",
  );
}
