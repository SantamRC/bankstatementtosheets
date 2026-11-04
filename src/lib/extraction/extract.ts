import "server-only";

// Next.js entry point for the extraction engine. The implementation lives in ./core so the CLI benchmark
// (scripts/benchmark.ts) can run it outside Next.js, where "server-only" would throw.
export * from "./core";
