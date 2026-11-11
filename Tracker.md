# Tracker

> What's done and what's pending. Update it in the same commit as the work.
> Decisions and the reasons for them live in `CLAUDE.md` (decision log). This file is the to-do list.
> 👤 = needs the owner (login, payment, or a click Claude can't make). 🤖 = Claude can do it.

_Last updated: 2026-11-11_

## 🔴 Pending: launch blockers

- [x] 👤 **Dodo approval** (2026-11-10): live mode enabled.
- [ ] 👤🤖 **Dodo live mode:**
  - [x] 🤖 live API key `bankstatementtosheets-prod` created (all scopes, write) and saved to `.env.live` (git-ignored) (2026-11-10)
  - [x] 🤖 `npm run dodo:setup -- --env .env.live`: 21 live products and the live webhook created (2026-11-10)
  - [x] 👤 `.env.live` pasted into Render; live deploy is up (2026-11-10)
  - [x] 🤖 checkout falls back to the email when the stored Dodo customer ID is stale (test → live)
  - [x] 👤 test-mode billing data cleared in prod (2026-11-10)
  - [x] 👤🤖 real live purchase verified (2026-11-10): Starter monthly INR ₹799 → webhook set Starter, 150 monthly pages, renews 2026-12-10; Manage billing opens the live customer portal
  - [x] 🤖 invoices cleaned up (2026-11-10): live products renamed to "BankStatementToSheets Starter (Monthly)" etc. (no "· INR" suffix; IDs unchanged), and the Dodo brand is now "BankStatementToSheets" with support@ as the support email
  - [x] 🤖 our own branded emails from no-reply@bankstatementtosheets.com (Brevo API, `src/lib/email.ts`): welcome on subscription start, a note on plan change, "pages added" on a pack. Each explains that the Dodo receipt and the DODOPAY_ card descriptor are ours (2026-11-10)
  - [x] 👤🤖 `BREVO_API_KEY` set on Render; a test welcome email was accepted by Brevo on prod (2026-11-10)
  - [x] 🤖 Dodo's "Subscription Plan Changed" customer email switched off (ours replaces it) (2026-11-10)
  - [x] 🤖 low-pages email: after a successful conversion that drops the balance to ≤20% of the monthly allowance (≤5 on Free), or to 0 (2026-11-10)
  - [x] 🤖 our own payment-failed email (webhook `subscription.on_hold`) and yearly renewal reminder 7 days ahead (`/api/cron/renewal-reminders`, daily GitHub Action `cron.yml`); Dodo's versions stay off (2026-11-10)
  - [x] 👤🤖 `CRON_SECRET` set on GitHub and Render; manual run of `cron.yml` returned 200 `{"checked":0,"sent":0}` (2026-11-11)
  - [ ] 🤖 "pages refilled" monthly email (needs a scheduled job; refills are lazy in `consume_pages`)
  - [ ] 👤 upload the logo in Dodo → Settings → Business → Primary brand → Edit (shown on checkout and invoices)
  - [ ] 👤 ask Dodo support whether INR payers can get an INR invoice with Dodo's GSTIN (the invoice for ₹799 shows USD 8.20 and has no GSTIN, so Indian businesses can't claim input tax credit)
  - [ ] 👤 own ₹799 test payment: cancel Starter in the customer portal (stops the 2026-12-10 renewal). Full refund fails with "insufficient balance": the payment settled as $8.20 but Dodo already took tax $1.25 + fees $0.66, leaving $6.29 in the wallet (checked 2026-11-11). Options: partial refund ≤ $6.29, ask Dodo support to refund in full, or skip it (it's paid out to you anyway once over the payout minimum). 2026-11-11: full-refund request emailed to support@dodopayments.com from santamrcdev404; awaiting reply
- [ ] 👤🤖 **Staging** (billing test environment, 2026-11-10):
  - [x] 🤖 Supabase project `bankstatementtosheets-staging` created, migrations applied, auth URLs set
  - [x] 🤖 Render service `bankstatementtosheets-staging` created (Free, auto-deploys main)
  - [x] 🤖 Dodo test-mode webhook pointed at staging
  - [ ] 👤 Render staging → Environment → **Add from .env**: paste `.env.staging`, then add `SUPABASE_SECRET_KEY` (staging project → API Keys → secret), `BREVO_API_KEY` (same as prod) and optionally `ANTHROPIC_API_KEY`. Save and deploy
  - [ ] 👤 sign in on staging, buy a plan with a Dodo test card; 🤖 verify the webhook, emails and dashboard; then test a decline card (payment-failed email), plan change, page pack and cancel
- [ ] 👤 **Render:** add a card and switch from Free to Starter ($7/mo). Free instances sleep and take ~50s to wake up. (2026-11-10: deploy 894e63e failed: built fine but the instance never started and the health check timed out after 15 min; the previous deploy stayed live.)
- [ ] 🤖 **Real conversion on prod:** check that a real PDF converts on prod. The Anthropic key on Render starts with `sk-ant-usr-`; if extraction fails, replace it with a normal `sk-ant-api…` key.
- [ ] 🤖 **Benchmark:** run `npm run bench` on 30+ real statements (US, UK, India, EU; digital and scanned). Record the real $/page and verified % in CLAUDE.md §3.
- [ ] 👤 **Legal:** review the privacy and terms templates; add a name and address.

## 🟡 Pending: before or just after launch

- [ ] 👤🤖 **Google Cloud OAuth** (Sheets export and Google login):
  - create a Web client with redirect `/api/google/callback` and scope `drive.file`, and publish the consent screen
  - enable the Sheets API and Drive API
  - set the `GOOGLE_*` env vars on Render
  - enable the Google provider in Supabase, then set `NEXT_PUBLIC_AUTH_GOOGLE`
- [ ] 🤖 **Analytics:** Cloudflare Web Analytics (free).
- [ ] 🤖 **Error tracking:** Sentry, then add the Sentry MCP.
- [ ] 🤖 **OG image** (`src/app/opengraph-image.tsx`).
- [ ] 👤 **Supabase pg_cron 30-day purge** of `conversions` (SQL at the bottom of `0001_init.sql`).
- [ ] 👤 **Dodo test-mode cleanup:**
  - cancel the test Pro subscription on the owner's account
  - archive the 7 old tax-exclusive USD products (unused)
- [ ] 👤 **Reconnect MCP connectors** to santamrcdev404: Render and Supabase still point at the old account or org.
- [ ] 👤 **Supabase:** delete the abandoned empty project `yrjzihenkouuyesduyxr`, which is paused in the KinoKrate org.
- [ ] 👤🤖 **Reply as support@:** Gmail "Send mail as" through Brevo SMTP.
- [ ] 🤖 **Local dev Supabase project:** local currently has none and bypasses auth. Create one if billing or history need local testing.
- [ ] 🤖 **Rate limiting** on `/api/extract`, and Turnstile on sign-up, only if free-tier abuse appears.
- [ ] Decide on **INR purchasing-power pricing** (~40% lower) if INR conversion is weak.

## 🟢 SEO plan (started 2026-11-08)

- [x] **Google Search Console** (2026-11-08):
  - domain property on santamrcdev404, verified through Cloudflare
  - sitemap submitted (27 pages found)
  - indexing requested for /, /bank-statement-to-excel, /banks, /banks/chase and /banks/hdfc-bank
- [x] **Bing Webmaster** (2026-11-08): imported from GSC (santamrcdev404), sitemap submitted, all 23 public URLs sent with URL Submission. Bing feeds ChatGPT search, Copilot and DuckDuckGo.
- [x] 🤖 **IndexNow** (2026-11-08): the key file is in `public/`. `npm run indexnow` (optionally with paths) submits URLs, and the GitHub Action `indexnow.yml` re-submits the sitemap 5 minutes after any push that changes pages.
- [ ] 🤖 **In about a week:** check Search Console coverage and the first queries, and request indexing for the remaining pages (quota is about 10 a day).
- [x] 🤖 **Keyword research** (2026-11-11, OpenSEO report 79919fc8, US + IN): "bank statement converter" is the head term (US 1,300 KD 6; IN 33,100 KD 16). Per-bank terms are ≤10/mo, so don't scale bank pages for volume. Homepage retitled around it, and "PDF" added to the /bank-statement-to-excel title.
- [x] 🤖 **On-page keyword pass** (2026-11-11): homepage FAQ +6 question keywords and a "Popular conversions & guides" link block; keyword FAQs on the 4 format pages; every bank page now has a "<bank> statement to Excel Converter" title plus 2 shared FAQs; 8 new banks (PNC, TD Bank, U.S. Bank, Santander UK, Bank of Baroda, PNB, Canara, Union Bank); Guides footer column.
- [x] 🤖 `/docuclipper-alternative` (2026-11-11; DocuClipper pricing re-checked that day; re-check before editing numbers). Later `/vs/moneythumb` (880/mo).
- [x] 🤖 `/bank-statements-for-mortgage` guide (2026-11-11).
- [x] 🤖 **Sitemap audit** (2026-11-11): 38 URLs, valid XML, all 200, canonicals match, no noindexed or redirected URLs, listed in robots.txt. Fixed: per-group accurate lastmod, dropped `<priority>`.
- [x] 🤖 **Guides hub + 3 guides** (2026-11-11): `/guides`, `/how-to-download-bank-statement` (23 banks' steps), `/how-to-read-a-bank-statement` (US/UK/India codes), `/bank-reconciliation-template-excel` with a free .xlsx (Reconciliation, Adjustments, Match, How to use).
- [x] 🤖 **First translated pages** (2026-11-11): es-MX `/es/convertir-estado-de-cuenta-pdf-a-excel` (Mexican sample statement, ≈1,000/mo) and hi-IN `/hi/bank-statement-kaise-nikale` (2,900/mo), with reciprocal hreflang. DE/FR/PT skipped (no volume).
- [x] 🤖 GSC (2026-11-11): indexing requested for /guides, the 3 new guides, /es and /hi; sitemap resubmitted (44 URLs). GSC is at `search.google.com/u/2/search-console` in the owner's Chrome.
- [ ] 🤖 In 4–6 weeks: check impressions for /es and /hi in Search Console. If they convert, translate the app UI (at least /convert and the pricing section) and consider MXN pricing; if /hi gets traffic, add a Hindi password guide.
- [ ] 🤖 Template guide: open the .xlsx in real Excel and Google Sheets once to confirm the formulas, dropdowns and highlighting work (only checked by reading the XML so far).
- [ ] 👤🤖 **Directory listings and launch posts** (highest impact; a new domain needs links): Product Hunt, AlternativeTo (as an alternative to DocuClipper and BankStatementConverter), G2, Capterra, SaaSHub, Indie Hackers. The owner creates the accounts; Claude drafts every listing.
- [ ] 👤🤖 **Promote the free reconciliation template:** r/Bookkeeping, r/Accounting, accountant forums, and "free accounting templates" roundup posts (pitch for a link).
- [ ] 🤖 **Analytics:** Cloudflare Web Analytics (free, no cookie banner) so we can see which pages lead to sign-ups.
- [ ] 🤖 **Audience pages:** `/for/accountants`, `/for/mortgage-brokers`.
- [ ] 🤖 **`/vs/moneythumb`** (~880/mo). Re-check their prices first.
- [ ] 👤 **OpenSEO rank tracking** for ~15 target keywords (spends credits; 153 left on 2026-11-11). Needs the owner's OK.
- [ ] 🤖 **More translated pages** only if /es and /hi show impressions in Search Console after 4–6 weeks.
- [x] 🤖 **Tally export + `/bank-statement-to-tally`** (2026-11-11; "pdf to tally" 320, "bank statement to tally" 110): Tally XML vouchers (Payment/Receipt/Contra) with bank ledger, default ledger and per-category mapping saved in localStorage. TallyPrime's own bank-statement import rejects PDF-derived files, so vouchers are the route (same as Suvit, Repotic, BankToLedger).
- [ ] 👤 **Test the Tally XML in a real TallyPrime** (backup company): create the ledgers, Import → Transactions, check vouchers and the bank ledger. Not yet tested in Tally itself (only unit tests and an XML validity check). If import fails, export a voucher from Tally as XML and send it over to match the format.
- [ ] 🤖 Tally follow-ups: optional ledger-master XML (create missing ledgers), bank allocations for BRS, and a Hindi Tally guide if /hi gets traffic.
- [x] 🤖 `/bank-statement-password` guide (2026-11-11). Formats are hedged because sources disagree. Next: password-protected PDF support (roadmap #4).
- [ ] 🤖 In 4–6 weeks: check Search Console for impressions on the new pages and the retitled homepage; request indexing for the new URLs.
- [ ] 👤 OpenSEO: 500 → ~270 credits. Approve saving the shortlist and adding rank tracking.
- [x] 🤖 **Phase 1, technical** (2026-11-08):
  - OG image (`opengraph-image.tsx`)
  - Organization and WebSite schema
  - `pageMeta()` gives every page its own title, description, canonical and OG tags
  - footer links to all the SEO pages
  - `keywords` meta removed
  - `llms.txt`
- [ ] 🤖 **Lighthouse / Core Web Vitals pass** on prod.
- [x] 🤖 **Phase 2, bank pages** (2026-11-08): `/banks` plus 15 banks in `src/lib/seo/banks.ts`:
  - US: Chase, Bank of America, Wells Fargo, Citi, Capital One, Amex
  - UK: Barclays, HSBC, Lloyds, NatWest
  - India: HDFC, ICICI, SBI, Axis, Kotak

  Each page has a sample in that bank's column layout, reconciled for real; download steps; quirks; an FAQ; and breadcrumb and FAQ schema.
- [ ] 🤖 **More bank pages, ordered by keyword data:**
  - Canada (TD, RBC), Australia (CommBank)
  - EU (ING, N26)
  - US credit unions, Discover, PNC, US Bank
  - India (PNB, Bank of Baroda, Yes Bank)
- [x] 🤖 **Phase 2, format pages** (2026-11-08): `/bank-statement-to-excel`, `/bank-statement-to-csv`, `/bank-statement-to-google-sheets` and `/credit-card-statement-to-excel`.
- [ ] 🤖 `/bank-statement-to-qbo` once QBO export ships (move QBO up the roadmap: high-intent accountant searches).
- [ ] 🤖 **Check credit-card reconciliation:** `reconcile()` uses `opening + credits − debits = closing`, but a card's balance is money owed, so it may mark a correct card statement as "mismatch". Test with a real card PDF and flip the formula for `credit_card`. Card SEO pages avoid the "verified" claim until this is fixed.
- [ ] 👤 **Google Sheets export is promised on the site but needs Google OAuth on prod** (see the item above).
- [ ] 🤖 **Phase 3:**
  - audience pages: `/for/accountants`, `/for/mortgage-brokers`
  - comparison pages: `/vs/docuclipper`, `/alternatives` (re-check competitor facts first)
  - how-to guides
- [ ] 👤🤖 **Phase 4, links:** Product Hunt, AlternativeTo, G2/Capterra, SaaS directories, Indie Hackers, and helpful Reddit/Quora answers.
- [ ] 🤖 **Phase 5, AI answers:** `llms.txt`, plus checking whether ChatGPT and Google AI Overviews cite us.

## 🔵 Roadmap (after launch, ordered by expected revenue impact)

1. SEO landing pages: `/banks/[bank]` and `/convert/pdf-to-csv` etc.
2. QBO / OFX / QIF export (QuickBooks, Xero).
3. Password-protected PDFs.
4. Side-by-side PDF preview with highlighting of the source row.
5. Team workspaces and client folders for accountants.
6. Public API, and Zapier.
7. Email-in conversion.
8. Image uploads (phone photos → PDF).
9. Cost: use the text layer for digital PDFs; batch API for bulk jobs.

## ✅ Done

**Product (2026-11-05 → 11-07)**
- [x] Converter:
  - Claude cascade extraction (Haiku first, Opus fallback)
  - balance reconciliation with sign-swap auto-fix
  - editable review table
- [x] Exports: Excel (multi-sheet, formulas, red negatives that work in Apple Numbers), CSV, TSV copy, Google Sheets (code ready, needs OAuth).
- [x] "Clean payee names" switch: highlighted, default OFF. The model returns `payee` and the transaction reference.
- [x] Landing page shows every feature. Also built: pricing in USD / EUR / INR with a monthly/yearly toggle, `/refunds`, `/contact`, and the privacy and terms templates.
- [x] Tests (`npm test`) and the benchmark script (`npm run bench`).

**Infrastructure**
- [x] Render service on the new account, with the domain https://bankstatementtosheets.com (2026-11-07).
- [x] Cloudflare zone on the new account: proxied, SSL Full (strict), Always HTTPS (2026-11-07).
- [x] Email Routing: `support@` and a catch-all forward to santamrcdev404@gmail.com.
- [x] Supabase prod project (Oregon). Migrations 0001, 0002 and 0003 applied; org transferred to santamrcdev404.
- [x] Auth email through Brevo SMTP (new account, domain authenticated). Magic-link sign-up tested on prod.
- [x] Accounts moved off santamdev404: Supabase, Render, Cloudflare and Brevo. Porkbun, Anthropic and GitHub stay on the old account by choice.

**Payments (Dodo, test mode)**
- [x] Dodo verification submitted (2026-11-07).
- [x] Stripe removed; Dodo checkout, customer portal and idempotent webhooks in place. Yearly plans refill pages monthly (2026-11-08).
- [x] Test purchase end to end on prod: Pro checkout → webhook → account upgraded → billing portal opens (2026-11-08).
- [x] 21 per-currency, tax-inclusive products generated from `plans.ts` with `npm run dodo:setup`. Pro INR checkout totals exactly ₹2,499 (2026-11-08).
