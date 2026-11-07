# Tracker

> What's done and what's pending. Update it in the same commit as the work.
> Decisions and the reasons for them live in `CLAUDE.md` (decision log). This file is the to-do list.
> 👤 = needs the owner (login, payment, or a click Claude can't make). 🤖 = Claude can do it.

_Last updated: 2026-11-08_

## 🔴 Pending: launch blockers

- [ ] 👤 **Dodo approval:** Product Information is under review (submitted 2026-11-07, up to 72h). Personal info and bank are approved.
- [ ] 👤🤖 **Dodo live mode** (after approval):
  - 👤 create a live API key and put it in `.env.live` together with `DODO_PAYMENTS_ENVIRONMENT=live_mode`
  - 🤖 run `npm run dodo:setup -- --env .env.live` (creates the 21 products and the webhook)
  - 👤🤖 copy the live product IDs, API key and webhook key to Render, and set `DODO_PAYMENTS_ENVIRONMENT=live_mode`
  - 🤖 make one real small purchase (a page pack), check that the webhook credits the pages, then refund it
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

- [ ] 👤 **Search Console + Bing Webmaster:** verify the domain with a DNS TXT record in Cloudflare, then submit `/sitemap.xml`.
- [ ] 👤 **OpenSEO:** 12 credits left; keyword research needs about 500. Top up, then 🤖 create a bankstatementtosheets.com project (US, IN, UK markets).
- [ ] 🤖 **Phase 1, technical:**
  - OG image
  - Organization and WebSite schema
  - unique title, description and canonical on every page
  - footer links to every SEO page
  - drop the `keywords` meta (Google ignores it)
  - Lighthouse / Core Web Vitals pass
- [ ] 🤖 **Phase 2, bank pages:** `/banks/[bank]` for about 20 banks (US, UK, India, EU). Each page has how-to-download steps, a sample statement in that bank's layout with a reconciled preview, an FAQ, and a call to action.
- [ ] 🤖 **Phase 2, format pages:**
  - `/pdf-to-excel`, `/pdf-to-csv`, `/pdf-to-google-sheets`
  - `/credit-card-statement-to-excel`
  - `/pdf-to-qbo` after QBO export ships
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
