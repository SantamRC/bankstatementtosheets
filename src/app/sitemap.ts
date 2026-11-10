import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { BANKS } from "@/lib/seo/banks";

// Bump when page content changes meaningfully (a fixed date avoids telling Google everything changed on every deploy).
const UPDATED = "2026-11-11";

const FORMAT_PATHS = ["/bank-statement-to-excel", "/bank-statement-to-csv", "/bank-statement-to-google-sheets", "/credit-card-statement-to-excel"];

export default function sitemap(): MetadataRoute.Sitemap {
  const page = (path: string, priority: number): MetadataRoute.Sitemap[number] => ({ url: `${SITE.url}${path}`, lastModified: UPDATED, priority });
  return [
    page("", 1),
    page("/convert", 0.9),
    page("/pricing", 0.8),
    ...FORMAT_PATHS.map((p) => page(p, 0.8)),
    ...["/docuclipper-alternative", "/bank-statement-password", "/bank-statements-for-mortgage"].map((p) => page(p, 0.7)),
    page("/banks", 0.7),
    ...BANKS.map((b) => page(`/banks/${b.slug}`, 0.7)),
    page("/contact", 0.4),
    page("/refunds", 0.3),
    page("/privacy", 0.3),
    page("/terms", 0.3),
  ];
}
