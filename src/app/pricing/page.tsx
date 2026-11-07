import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo/meta";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/Sections";

export const metadata: Metadata = pageMeta({
  title: "Pricing — Bank Statement Converter Plans from $9/mo",
  description: "Simple per-page pricing for converting bank statements to Excel, CSV and Google Sheets. 20 pages free, no card required. Failed conversions are never charged.",
  path: "/pricing",
});

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main className="pt-6">
        <Pricing />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
