# Tracker

> What's done and what's pending. Update it in the same commit as the work.
> Decisions and the reasons for them live in `CLAUDE.md` (decision log). This file is the to-do list.
> 👤 = needs the owner (login, payment, or a click Claude can't make). 🤖 = Claude can do it.

_Last updated: 2026-11-10_

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
  - [ ] 👤 upload the logo in Dodo → Settings → Business → Primary brand → Edit (shown on checkout and invoices)
  - [ ] 👤 ask Dodo support whether INR payers can get an INR invoice with Dodo's GSTIN (the invoice for ₹799 shows USD 8.20 and has no GSTIN, so Indian businesses can't claim input tax credit)
  - [ ] 👤 decide: keep the Starter subscription, or cancel it in the portal and refund the ₹799 in Dodo → Transactions
- [ ] 👤 **Render:** add a card and switch from Free to Starter ($7/mo). Free instances sleep and take ~50s to wake up.
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
- [ ] 👤 **OpenSEO:** 12 credits left; keyword research needs about 500. Top up, then 🤖 create a bankstatementtosheets.com project (US, IN, UK markets).
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
