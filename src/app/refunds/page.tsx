import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/site/LegalPage";
import { SITE } from "@/lib/site";
import { FREE_PAGES } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy",
  description: "Cancel any time, 14-day money-back on your first payment, and failed conversions never cost you pages.",
  alternates: { canonical: "/refunds" },
};

export default function Refunds() {
  return (
    <LegalPage title="Refund & Cancellation Policy" updated="November 6, 2026">
      <p>
        We want you to pay only for conversions that work. This policy covers subscriptions (Starter, Pro, Business) and one-time page
        packs bought on {SITE.domain}.
      </p>

      <h2>Try before you pay</h2>
      <p>
        Every account gets {FREE_PAGES} free pages, with no card required, so you can check the results on your own statements before buying
        anything.
      </p>

      <h2>Failed conversions are never charged</h2>
      <p>
        Pages are reserved when a conversion starts. If the conversion fails (for example the file can’t be read), the pages go back
        to your balance automatically. You don’t need to ask.
      </p>
      <p>
        If a conversion completes but the result is wrong and we can’t fix it, email us and we’ll give those pages back.
      </p>

      <h2>14-day money-back guarantee</h2>
      <ul>
        <li>
          <strong>First subscription payment:</strong> if you ask within 14 days of your first payment for a plan and have used less than
          20% of that period’s pages, we’ll refund the payment in full.
        </li>
        <li>
          <strong>Page packs:</strong> refundable in full within 14 days of purchase if you have used less than 20% of the pack’s pages.
        </li>
        <li>
          <strong>Forgot to cancel?</strong> If a renewal charge went through and you haven’t converted any pages since, ask within 14
          days of the charge and we’ll refund it.
        </li>
      </ul>
      <p>
        Outside these cases, payments for periods that have already started aren’t refunded. If something went wrong for you anyway,
        write to us. We read every message and handle each case fairly.
      </p>

      <h2>Cancelling a subscription</h2>
      <ul>
        <li>
          You can cancel at any time from your <Link href="/dashboard" className="underline">dashboard</Link> (Manage billing). There are
          no cancellation fees and no lock-in.
        </li>
        <li>Your plan stays active until the end of the period you’ve paid for. After that you won’t be charged again.</li>
        <li>Unused monthly pages expire at the end of the billing period. Pages from packs and your free sign-up pages stay in your account.</li>
        <li>Switching to a lower plan takes effect at your next renewal.</li>
      </ul>

      <h2>How to ask for a refund</h2>
      <p>
        Email <a href={`mailto:${SITE.email}?subject=Refund%20request`} className="underline">{SITE.email}</a> from the address you
        signed up with and tell us which payment it’s about. We reply within 2 business days. Approved refunds go back to your original
        payment method and usually appear within 5–10 business days, depending on your bank.
      </p>
      <p>
        Payments are processed by our payment partner, who acts as the merchant of record and may appear on your card statement.
        Please contact us before disputing a charge with your bank. We can almost always sort it out faster.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this policy: <a href={`mailto:${SITE.email}`} className="underline">{SITE.email}</a> or see our{" "}
        <Link href="/contact" className="underline">contact page</Link>.
      </p>
    </LegalPage>
  );
}
