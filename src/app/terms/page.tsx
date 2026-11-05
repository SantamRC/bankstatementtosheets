import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/site/LegalPage";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Terms of Service", alternates: { canonical: "/terms" } };

// NOTE: Template — have this reviewed by a lawyer before launch.
export default function Terms() {
  return (
    <LegalPage title="Terms of Service" updated="November 6, 2026">
      <p>By using {SITE.domain} you agree to these terms.</p>
      <h2>The service</h2>
      <p>
        We convert PDF bank and credit card statements into spreadsheet formats using automated extraction. We check extracted data
        against the balances printed on your statement, but you are responsible for reviewing results before relying on them for
        accounting, tax, lending or legal purposes.
      </p>
      <h2>Your content</h2>
      <p>Only upload statements you have the right to process. You keep all rights to your documents and data.</p>
      <h2>Plans, pages & refunds</h2>
      <ul>
        <li>One credit is used per PDF page converted. Failed conversions are not charged.</li>
        <li>Monthly page allowances reset each billing cycle and don’t roll over. Purchased page packs never expire.</li>
        <li>You can cancel any time from the billing portal; your plan stays active until the end of the paid period.</li>
        <li>
          Refunds, including our 14-day money-back guarantee, are covered by the{" "}
          <Link href="/refunds" className="underline">Refund &amp; Cancellation Policy</Link>.
        </li>
      </ul>
      <h2>Acceptable use</h2>
      <p>No reverse engineering, abuse of free allowances, or uploading content that is unlawful or that you are not authorised to process.</p>
      <h2>Liability</h2>
      <p>The service is provided “as is”. To the maximum extent permitted by law, our liability is limited to the amount you paid us in the 12 months before the claim.</p>
      <h2>Contact</h2>
      <p>{SITE.email}</p>
    </LegalPage>
  );
}
