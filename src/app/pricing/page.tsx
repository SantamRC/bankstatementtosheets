import type { Metadata } from "next";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/Sections";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple per-page pricing for converting bank statements to Excel and Google Sheets. 20 pages free, no card required.",
  alternates: { canonical: "/pricing" },
};

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
