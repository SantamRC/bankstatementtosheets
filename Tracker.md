# Tracker

> What's done and what's pending. Update it in the same commit as the work.
> Decisions and the reasons for them live in `CLAUDE.md` (decision log). This file is the to-do list.
> 👤 = needs the owner (login, payment, or a click Claude can't make). 🤖 = Claude can do it.

_Last updated: 2026-11-14_

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
  - [x] 👤 logo uploaded to the Dodo primary brand (live), shown on checkout and invoices (2026-11-11)
  - [ ] 👤 ask Dodo support whether INR payers can get an INR invoice with Dodo's GSTIN (the invoice for ₹799 shows USD 8.20 and has no GSTIN, so Indian businesses can't claim input tax credit) 2026-11-11: question sent in the refund thread (escalated to a human by Dodo's AI support); awaiting reply
  - [ ] 👤 own ₹799 test payment: ~~cancel Starter~~ (cancelled 2026-11-11; account back on Free). Full refund fails with "insufficient balance": the payment settled as $8.20 but Dodo already took tax $1.25 + fees $0.66, leaving $6.29 in the wallet (checked 2026-11-11). Options: partial refund ≤ $6.29, ask Dodo support to refund in full, or skip it (it's paid out to you anyway once over the payout minimum). 2026-11-11: full-refund request emailed to support@dodopayments.com from santamrcdev404; awaiting reply
  - [x] 🤖 existing subscribers who pick another plan now get a Dodo plan change (prorated) instead of a second subscription; webhook ignores events for a non-current subscription (2026-11-11)
  - [x] 👤 Dodo live → Settings → Subscriptions: "Allow Multiple Subscriptions" and "Allow Immediate Cancellation" OFF; cancel at next billing date stays ON (2026-11-11)
  - [x] 👤🤖 staging test (2026-11-12): Starter monthly ($9, test card) → Pro yearly ($279 prorated) → Pro monthly ($0): one Dodo subscription throughout; dashboard Pro, 600 + 20 bonus pages
  - [x] 🤖 fix: a plan change no longer refills the month (Pro → Starter → Pro gave 600 fresh pages each time); pages left shift by the allowance difference and the monthly cycle is kept (2026-11-12)
  - [x] 👤🤖 staging (2026-11-12): welcome + plan-change emails arrived; page pack +100 bonus pages; Pro → Starter kept the cycle; cancel at next billing date → dashboard shows "Ends 11 Dec 2026", plan kept until then
  - [ ] 🤖 untested: payment failed (`on_hold`) only happens on a failed renewal; check the first real one in the logs
- [ ] 👤🤖 **Staging** (billing test environment, 2026-11-10):
  - [x] 🤖 Supabase project `bankstatementtosheets-staging` created, migrations applied, auth URLs set
  - [x] 🤖 Render service `bankstatementtosheets-staging` created (Free, auto-deploys main)
  - [x] 🤖 Dodo test-mode webhook pointed at staging
  - [x] 👤 Render staging env set (Supabase staging, Dodo test_mode keys + 24 products, Brevo, Anthropic); health 200 (checked 2026-11-11). `APP_SECRET` not set (only needed for Google Sheets)
  - [x] 👤🤖 staging billing test done (2026-11-12, see the Dodo live mode items above)
- [x] 👤 **Render:** prod switched from Free to Starter (0.5 CPU / 512 MB, $7/mo); no more sleeping (2026-11-11)
- [x] 🤖 **Real conversion on prod:** works; the owner converted a 4-page Standard Chartered statement on 2026-11-06 and 11-07 (in history on the prod dashboard)
- [x] 🤖 **Benchmark (synthetic)** 2026-11-12: 14 statements / 30 pages, cascade 100% exact vs truth at $0.0025/page, 0% escalation; Opus-only $0.074/page (CLAUDE.md §3)
- [ ] 👤🤖 **Benchmark (real):** drop 5–10 real statements (esp. bad scans, credit card) in `bench/statements/real/` and run `npm run bench -- --dir bench/statements/real --yes` to check accuracy and escalation on messy input
- [ ] 👤 **Dodo 2FA:** set up two-factor authentication on the Dodo account by **2026-12-12** (Dodo email 2026-11-12), or dashboard access gets blocked.
- [ ] 👤 **Legal:** review the privacy and terms templates; add a name and address.

## 🟡 Pending: before or just after launch

- [ ] 🤖 **Sign-in UX:** add a 6-digit code to the magic-link email (type it in the same tab; works when email is opened on a phone), and make the "Check your email" tab continue on its own once signed in elsewhere. Needs `{{ .Token }}` in the Supabase email templates (staging + prod).

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
  - ~~cancel the test Pro subscription on the owner's account~~ (cancelled 2026-11-12; it blocked staging checkout for the same email)
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
- [x] 🤖 **Credit-card reconciliation** (2026-11-14): `reconcile()` now tries both balance directions (bank: balance = money held; card/loan: balance = money owed) and keeps the account type's direction unless the other clearly ties out better. Before, card statements with running balances got every row "auto-fixed" (purchases flipped into credits). 7 new tests. The card SEO page and sample now show "verified". Still to do: confirm with a real card PDF in the real benchmark.
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
