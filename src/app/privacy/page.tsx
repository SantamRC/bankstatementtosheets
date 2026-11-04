import type { Metadata } from "next";
import { LegalPage } from "@/components/site/LegalPage";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy Policy", alternates: { canonical: "/privacy" } };

// NOTE: Template — have this reviewed by a lawyer before launch (GDPR/CCPA specifics, company entity, address).
export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy" updated="November 5, 2026">
      <p>
        {SITE.domain} (“we”, “us”) converts bank statements into spreadsheets. Bank statements are sensitive, so this policy is short and
        specific about what we keep.
      </p>
      <h2>What we collect</h2>
      <ul>
        <li>Account data: your email address and, if you sign in with Google, your name.</li>
        <li>Uploaded PDFs: processed in memory to extract transactions and discarded immediately. We never write your PDF to disk or storage.</li>
        <li>Extracted data: the transaction table we produce, saved to your account history for 30 days so you can re-download it. You can delete it at any time.</li>
        <li>Billing data: handled by Stripe. We never see or store your full card number.</li>
        <li>Basic usage logs (pages converted, errors) to operate and improve the service.</li>
      </ul>
      <h2>Processors we use</h2>
      <ul>
        <li>Anthropic (AI extraction). Under Anthropic’s commercial terms, API inputs and outputs are not used to train models.</li>
        <li>Supabase (authentication and database, encrypted at rest).</li>
        <li>Stripe (payments), Render (hosting) and Cloudflare (network security and content delivery).</li>
        <li>Google (only if you choose Google Sheets export, using the drive.file scope — we can access only the spreadsheets we create for you).</li>
      </ul>
      <h2>Retention & deletion</h2>
      <p>Conversion history is deleted automatically after 30 days. Deleting your account removes your profile and all saved conversions.</p>
      <h2>Your rights</h2>
      <p>You can access, export or delete your data at any time. Email {SITE.email} and we’ll respond within 30 days.</p>
      <h2>Contact</h2>
      <p>{SITE.email}</p>
    </LegalPage>
  );
}
