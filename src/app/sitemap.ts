import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { BANKS } from "@/lib/seo/banks";

// lastmod = date of the last meaningful content change for that group of pages. Bump only the group you changed:
// Google trusts lastmod only when it's accurate, so never bump everything on every deploy.
const UPDATED = {
  home: "2026-11-11",
  seo: "2026-11-11", // format, guide, comparison and bank pages
  app: "2026-11-08", // /convert, /pricing
  legal: "2026-11-08", // contact, refunds, privacy, terms
};

const FORMAT_PATHS = ["/bank-statement-to-excel", "/bank-statement-to-csv", "/bank-statement-to-google-sheets", "/credit-card-statement-to-excel", "/bank-statement-to-tally"];
const GUIDE_PATHS = [
  "/guides",
  "/how-to-download-bank-statement",
  "/how-to-read-a-bank-statement",
  "/bank-reconciliation-template-excel",
  "/docuclipper-alternative",
  "/bank-statement-password",
  "/bank-statements-for-mortgage",
  "/es/convertir-estado-de-cuenta-pdf-a-excel",
  "/hi/bank-statement-kaise-nikale",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const page = (path: string, lastModified: string): MetadataRoute.Sitemap[number] => ({ url: `${SITE.url}${path}`, lastModified });
  return [
    page("", UPDATED.home),
    page("/convert", UPDATED.app),
    page("/pricing", UPDATED.app),
    ...[...FORMAT_PATHS, ...GUIDE_PATHS, "/banks", ...BANKS.map((b) => `/banks/${b.slug}`)].map((p) => page(p, UPDATED.seo)),
    ...["/contact", "/refunds", "/privacy", "/terms"].map((p) => page(p, UPDATED.legal)),
  ];
}
