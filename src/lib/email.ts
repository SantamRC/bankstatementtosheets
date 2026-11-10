import "server-only";
import { SITE_URL } from "@/lib/env";
import { LAUNCH_OFFER } from "@/lib/plans";

/**
 * Our own transactional email, sent from our domain via the Brevo API (BREVO_API_KEY). Dodo still sends the receipt
 * and tax invoice itself (it is the merchant of record and can't send from our domain); these emails welcome the
 * customer in our voice and explain that the Dodo receipt is ours. No-op when BREVO_API_KEY is unset.
 */
const FROM = { name: "BankStatementToSheets", email: process.env.EMAIL_FROM || "no-reply@bankstatementtosheets.com" };
const REPLY_TO = { email: "support@bankstatementtosheets.com" };
const DESCRIPTOR = "DODOPAY_BANKSTATEMENTT";

export const isEmailConfigured = Boolean(process.env.BREVO_API_KEY);

async function send(to: string, subject: string, html: string, text: string) {
  if (!isEmailConfigured) return;
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": process.env.BREVO_API_KEY!, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ sender: FROM, replyTo: REPLY_TO, to: [{ email: to }], subject, htmlContent: html, textContent: text }),
  });
  if (!res.ok) throw new Error(`brevo ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** Brand-styled shell: paper background, ink text, brand-green button (tokens from globals.css). */
function layout(heading: string, paras: string[], cta: { label: string; href: string }, billingNote = true) {
  const p = paras.map((x) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:#0d1512">${x}</p>`).join("");
  return `<!doctype html><html><body style="margin:0;background:#f7f6f1;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f6f1;padding:32px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #e4e2d9;border-radius:14px;padding:32px">
<tr><td>
<div style="font-size:14px;font-weight:600;color:#0b6e4f;margin-bottom:20px">BankStatementToSheets</div>
<h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#0d1512">${heading}</h1>
${p}
<a href="${cta.href}" style="display:inline-block;margin:6px 0 22px;background:#0b6e4f;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 20px;border-radius:10px">${cta.label}</a>
<p style="margin:0;font-size:13px;line-height:1.5;color:#5b6660">${billingNote ? `Your receipt and tax invoice come in a separate email from <b>Dodo Payments</b>, our payment provider and merchant of record. Your card or bank statement shows <b>${DESCRIPTOR}</b>. ` : ""}Questions? Just reply to this email.</p>
</td></tr></table>
<p style="font-size:12px;color:#8a918c;margin:16px 0 0">BankStatementToSheets · <a href="${SITE_URL}" style="color:#8a918c">bankstatementtosheets.com</a></p>
</td></tr></table></body></html>`;
}

const footerText = `\n\nYour receipt and tax invoice come in a separate email from Dodo Payments, our payment provider and merchant of record. Your card or bank statement shows ${DESCRIPTOR}. Questions? Reply to this email.\n\nBankStatementToSheets · ${SITE_URL}`;

export async function sendPlanWelcome(to: string, planName: string, pages: number, changed = false) {
  const pagesStr = pages.toLocaleString("en-US");
  const subject = changed ? `Your plan is now ${planName}` : `Welcome to BankStatementToSheets ${planName}`;
  const lock = LAUNCH_OFFER.active ? " You're on launch pricing, so your price stays the same for as long as you stay subscribed." : "";
  const paras = [
    changed
      ? `Your plan has changed to <b>${esc(planName)}</b>. You now get <b>${pagesStr} pages every month</b>.`
      : `Thanks for subscribing. Your <b>${esc(planName)}</b> plan is active: <b>${pagesStr} pages every month</b>, and every statement is checked against its own running balance.${lock}`,
    `Manage your plan, invoices and payment method any time from your dashboard.`,
  ];
  const text = `${subject}\n\n${paras.map((x) => x.replace(/<[^>]+>/g, "")).join("\n\n")}\n\nConvert a statement: ${SITE_URL}/convert${footerText}`;
  await send(to, subject, layout(subject, paras, { label: "Convert a statement", href: `${SITE_URL}/convert` }), text);
}

export async function sendPackAdded(to: string, pages: number) {
  const subject = `${pages} pages added to your account`;
  const paras = [`Thanks for your purchase. <b>${pages} pages</b> are now in your account, and they never expire.`];
  const text = `${subject}\n\n${paras[0].replace(/<[^>]+>/g, "")}\n\nConvert a statement: ${SITE_URL}/convert${footerText}`;
  await send(to, subject, layout(subject, paras, { label: "Convert a statement", href: `${SITE_URL}/convert` }), text);
}

/** Sent once when a successful conversion takes the balance down past the low-pages threshold (see lowPagesThreshold). */
export async function sendLowPages(
  to: string,
  o: { left: number; planName: string; isFree: boolean; resetsAt: string | null },
) {
  const out = o.left === 0;
  const subject = out ? "You've used all your pages" : `You have ${o.left} page${o.left === 1 ? "" : "s"} left`;
  const refill =
    !o.isFree && o.resetsAt
      ? ` Your ${esc(o.planName)} pages refill on <b>${new Date(o.resetsAt).toLocaleDateString("en-US", { month: "long", day: "numeric" })}</b>.`
      : "";
  const paras = [
    out
      ? `You've converted every page on your account.${refill}`
      : `You have <b>${o.left} page${o.left === 1 ? "" : "s"}</b> left on your account.${refill}`,
    o.isFree
      ? `Paid plans start at 150 pages a month, with every row checked against the statement's running balance. Launch pricing is locked in for as long as you stay subscribed.`
      : `Need more before then? A page pack adds 100 pages that never expire, or move up a plan for more pages every month.`,
  ];
  const cta = { label: o.isFree ? "See plans" : "Get more pages", href: `${SITE_URL}/pricing` };
  const text = `${subject}\n\n${paras.map((x) => x.replace(/<[^>]+>/g, "")).join("\n\n")}\n\n${cta.label}: ${cta.href}\n\nBankStatementToSheets · ${SITE_URL}`;
  await send(to, subject, layout(subject, paras, cta, false), text);
}

/** Low-pages threshold: 20% of the monthly allowance on paid plans, 5 pages on Free. */
export const lowPagesThreshold = (monthlyAllowance: number) => (monthlyAllowance > 0 ? Math.floor(monthlyAllowance * 0.2) : 5);

/** subscription.on_hold: a renewal charge failed, so monthly pages are paused until the card is updated. */
export async function sendPaymentFailed(to: string, planName: string) {
  const subject = "Your payment didn't go through";
  const paras = [
    `We couldn't renew your <b>${esc(planName)}</b> plan because the payment failed. Your monthly pages are paused until it's sorted. Any bonus pages you have still work.`,
    `Open your dashboard and choose <b>Manage billing</b> to update your card or UPI method. Your plan picks up again as soon as a payment goes through, at the same price.`,
  ];
  const cta = { label: "Update payment method", href: `${SITE_URL}/dashboard` };
  const text = `${subject}\n\n${paras.map((x) => x.replace(/<[^>]+>/g, "")).join("\n\n")}\n\n${cta.label}: ${cta.href}\n\nBankStatementToSheets · ${SITE_URL}`;
  await send(to, subject, layout(subject, paras, cta, false), text);
}

/** Sent ~7 days before a yearly renewal (daily cron: /api/cron/renewal-reminders). */
export async function sendRenewalReminder(to: string, o: { planName: string; amount: string; date: string }) {
  const subject = `Your ${o.planName} plan renews on ${o.date}`;
  const paras = [
    `This is a heads-up that your yearly <b>${esc(o.planName)}</b> plan renews on <b>${esc(o.date)}</b> for <b>${esc(o.amount)}</b>. Nothing to do if you'd like to continue.`,
    `To change or cancel, open your dashboard and choose <b>Manage billing</b> before that date.`,
  ];
  const cta = { label: "Manage billing", href: `${SITE_URL}/dashboard` };
  const text = `${subject}\n\n${paras.map((x) => x.replace(/<[^>]+>/g, "")).join("\n\n")}\n\n${cta.label}: ${cta.href}${footerText}`;
  await send(to, subject, layout(subject, paras, cta), text);
}
