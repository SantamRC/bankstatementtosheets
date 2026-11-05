import type { Metadata } from "next";
import Link from "next/link";
import { CreditCard, LifeBuoy, Mail, ShieldCheck } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: `Get help with conversions, billing or privacy. Email ${SITE.email}. We reply within one business day.`,
  alternates: { canonical: "/contact" },
};

const mail = (subject: string) => `mailto:${SITE.email}?subject=${encodeURIComponent(subject)}`;

const TOPICS = [
  {
    icon: LifeBuoy,
    title: "Conversion help",
    body: "A statement didn’t convert, or rows look wrong? Tell us the bank and what you expected. Please don’t attach the PDF unless we ask.",
    subject: "Conversion help",
  },
  {
    icon: CreditCard,
    title: "Billing & refunds",
    body: "Plans, invoices, cancellations and refunds. Include the email you signed up with.",
    subject: "Billing question",
    link: { href: "/refunds", label: "Refund & cancellation policy" },
  },
  {
    icon: ShieldCheck,
    title: "Privacy & data",
    body: "Ask what we hold about you, or ask us to delete your account and conversion history.",
    subject: "Privacy request",
    link: { href: "/privacy", label: "Privacy policy" },
  },
];

export default function Contact() {
  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-16 sm:px-6">
        <h1 className="text-4xl font-semibold tracking-tight">Contact us</h1>
        <p className="mt-3 max-w-2xl text-ink-soft">
          A real person reads every message. We reply within one business day, usually much sooner.
        </p>

        <a
          href={`mailto:${SITE.email}`}
          className="mt-8 flex flex-col gap-1 rounded-2xl border border-line bg-white p-6 transition hover:border-brand sm:flex-row sm:items-center sm:gap-4"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <Mail className="size-5" aria-hidden />
          </span>
          <span>
            <span className="block text-sm text-muted">Email</span>
            <span className="block break-all text-lg font-semibold text-ink">{SITE.email}</span>
          </span>
        </a>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {TOPICS.map((t) => (
            <div key={t.title} className="flex flex-col rounded-2xl border border-line bg-white p-5">
              <t.icon className="size-5 text-brand" aria-hidden />
              <h2 className="mt-3 font-semibold">{t.title}</h2>
              <p className="mt-1 flex-1 text-sm text-ink-soft">{t.body}</p>
              <div className="mt-4 flex flex-col gap-1 text-sm">
                <a href={mail(t.subject)} className="font-medium text-brand hover:underline">
                  Email about this →
                </a>
                {t.link && (
                  <Link href={t.link.href} className="text-muted hover:text-ink hover:underline">
                    {t.link.label}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-10 text-sm text-muted">
          Security issue? Email {SITE.email} with “Security” in the subject and we’ll prioritise it.
        </p>
      </main>
      <Footer />
    </>
  );
}
