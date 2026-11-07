import type { Metadata } from "next";

const OG_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: "BankStatementToSheets — bank statements to Excel, verified to the cent" };

/**
 * Per-page metadata with matching canonical, Open Graph and Twitter tags.
 * (A child's `openGraph` replaces the parent's entirely, so the image is set here explicitly.)
 */
export function pageMeta({ title, description, path, absoluteTitle }: { title: string; description: string; path: string; absoluteTitle?: boolean }): Metadata {
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: { type: "website", siteName: "BankStatementToSheets", title, description, url: path, images: [OG_IMAGE] },
    twitter: { card: "summary_large_image", title, description, images: [OG_IMAGE.url] },
  };
}
