import type { Metadata } from "next";

const OG_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: "BankStatementToSheets — bank statements to Excel, verified to the cent" };

/**
 * Per-page metadata with matching canonical, Open Graph and Twitter tags.
 * (A child's `openGraph` replaces the parent's entirely, so the image is set here explicitly.)
 * `languages` adds hreflang alternates (include this page itself and "x-default"); every page in a set must list the same map.
 */
export function pageMeta({
  title,
  description,
  path,
  absoluteTitle,
  languages,
  locale,
}: {
  title: string;
  description: string;
  path: string;
  absoluteTitle?: boolean;
  languages?: Record<string, string>;
  locale?: string;
}): Metadata {
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path, ...(languages && { languages }) },
    openGraph: { type: "website", siteName: "BankStatementToSheets", title, description, url: path, images: [OG_IMAGE], ...(locale && { locale }) },
    twitter: { card: "summary_large_image", title, description, images: [OG_IMAGE.url] },
  };
}

/** hreflang sets (path per language). Keep each set identical on every page it names. */
export const HREFLANG = {
  excel: { en: "/bank-statement-to-excel", "es-MX": "/es/convertir-estado-de-cuenta-pdf-a-excel", "x-default": "/bank-statement-to-excel" },
  download: { en: "/how-to-download-bank-statement", "hi-IN": "/hi/bank-statement-kaise-nikale", "x-default": "/how-to-download-bank-statement" },
};
