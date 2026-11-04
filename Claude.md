# BankStatementToSheets — project memory

> Read this first in every session. Keep it current: when a decision changes, update the relevant section
> and add a line to the **Decision log** at the bottom.

## 1. What we're building

**bankstatementtosheets.com** (domain bought on Porkbun). A web app that converts PDF bank and credit-card statements
(digital or scanned, any bank, any country) into Excel, CSV and Google Sheets.

**Goal:** get early paying customers fast. The product is better than competitors in three ways:
1. **Trust:** every row is checked against the statement's own running balance (we call this "verified to the cent").
2. **UX:** a review screen where users can edit before exporting, and polished output files.
3. **Accuracy on any layout:** a frontier vision model reads the page. There are no per-bank templates.

**Target customers, by priority:** bookkeepers/accountants (they pay and have recurring volume) → lenders/mortgage brokers →
small businesses → personal finance/tax users.

## 2. Competitor analysis (researched 2026-11-05)

| Competitor | Model / price (from listings, unverified) | Weakness we exploit |
|---|---|---|
| BankStatementConverter.com | Simple online converter; free tier plus monthly page plans | Raw dump, no verification, dated UI |
| DocuClipper | ~$39+/mo, 14-day trial, QBO/Xero export, claims 99.6% accuracy | Complex, enterprise-y, expensive for small users |
| MoneyThumb | Pro ~$99.95/mo for 60 conversions, desktop heritage | Expensive; old UX |
| Statements to Sheets | $9/mo for 500 transactions; deterministic parsing with AI as fallback | Transaction-capped, newer, little track record |
| BankConv | $2.99/doc or $29–79/mo; first 5 pages free | Per-document pricing is confusing |
| Bank Parser, CreditCardToExcel, BankStmtConverter | Pay-as-you-go from ~$1.99; $49/mo business plans | Commodity products with weak trust signals |

**Common user pains:** silent errors (dropped rows, flipped signs), scanned PDFs failing, confusing credit pricing,
having to clean the output in Excel, privacy worries.

**Our answers:** balance reconciliation with automatic sign-swap fixing, vision-model extraction, simple per-page pricing
with failed jobs refunded, formatted multi-sheet Excel with live formulas, and a strong privacy stance (PDFs are never stored).

## 3. Pricing (in `src/lib/plans.ts`): launch pricing, set 2026-11-05

**Positioning:** mid-market. We're priced above the commodity converters, which charge about $0.01–0.04/page and
don't verify anything. We're far below DocuClipper, the premium incumbent.

Prices are shown in **USD, EUR or INR**, chosen from a dropdown on the pricing section. The default comes from the
visitor's time zone (Asia/Kolkata → INR, eurozone → EUR, everyone else → USD), and the choice is remembered in localStorage.

| Plan | USD monthly / yearly-per-mo | EUR monthly / yearly-per-mo | INR monthly / yearly-per-mo | Pages/mo |
|---|---|---|---|---|
| Free | $0 | €0 | ₹0 | 20 one-time |
| Starter | $9 / $7 | €9 / €7 | ₹799 / ₹599 | 150 |
| Pro (highlighted) | $29 / $24 | €29 / €24 | ₹2,499 / ₹1,999 | 600 |
| Business | $79 / $65 | €79 / €65 | ₹6,999 / ₹5,499 | 2,500 |
| Page pack | $10 | €10 | ₹899 | 100, never expire |

- EUR uses the same numbers as USD, as most SaaS companies do. INR is the USD price at about ₹88/$, rounded to a ...99
  price point. These are fixed price points, not live exchange-rate conversions. Yearly billing saves at least
  2 months in every currency (the toggle says "2+ months free").
- The source of truth is `PLANS[].price[currency]` and `PAGE_PACK.price` in `src/lib/plans.ts`.
- **Not done yet:** purchasing-power pricing for India. ₹2,499/mo is a meaningful amount for Indian freelancers.
  If INR conversion is weak, consider cutting INR prices about 40%.

**Launch offer** (`LAUNCH_OFFER` in plans.ts): anyone who subscribes before **2027-01-31** keeps their price for as long as
they stay subscribed. To honour it later, create NEW Stripe price IDs for new customers. Never edit existing
subscriptions. Set `active: false` once the offer ends.

**Competitor anchors** (checked on their pricing pages, 2026-11-05):
- DocuClipper: Starter $29/mo for 60 pages ($20.30 annually); Business $159/mo for 640 pages ($111.30 annually);
  Enterprise $279.30/mo annually for 1,800 pages. 14-day trial up to 120 pages. Unlimited users. No page rollover.
- yourbankstatementconverter.com: $15/400, $30/1,000, $50/4,000 pages per month. 7 free pages.
- Other listings (unverified): BankFormats €9/100 and €15/200; bank2xl $7/100 and $49/2,000; BankConv $2.99 per document.
- Headline claims we can make: **Pro gives 10× DocuClipper Starter's pages for the same $29**, and Business gives about 4×
  DocuClipper Business's pages for half the price. Don't publish competitor prices on the site without re-checking them.

**Rules:**
- 1 page = 1 credit. Pages are reserved atomically before extraction and **refunded if extraction fails**.
- The monthly allowance resets on each `invoice.paid`. Bonus pages (free signup pages and packs) never expire.
  Monthly pages are spent first.

### ⚠️ Unit economics — not yet measured, VALIDATE BEFORE LAUNCH
- The default model is `claude-opus-5-5` ($4 input / $20 output per million tokens). A PDF page sent as a document costs roughly
  1.5–3k input tokens. Output plus thinking is about 1–3k tokens per page.
  **Rough estimate: $0.03–0.07 per page.** Launch prices are $0.032–0.060/page, so at full usage **Pro is about
  break-even on Opus and Business loses money**. Average plan utilization is usually well below 100%, but don't rely on that.
  The break-even model cost for Business is under $0.026/page (yearly price).
- Every chunk logs `[extract] model=… in=… out=…`. Run 20–30 real statements and compute the actual $/page.
- Levers, all set in env with no code change: `EXTRACTION_MODEL=claude-sonnet-5-5` ($2/$10) or `claude-haiku-5-5`
  ($0.10/$0.50), `EXTRACTION_EFFORT=low`, or raise prices. Measure accuracy (the reconciliation pass rate) for each
  model before switching. The model choice is the owner's decision.
- Planned cost optimization: for PDFs that have a text layer, send extracted text instead of the full page image.

## 4. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 16** (App Router, Turbopack, `cacheComponents` on), React 19, TypeScript | Static landing page for SEO plus API routes in one deploy |
| Styling | Tailwind CSS v4 (tokens in `src/app/globals.css` `@theme`), lucide-react icons | Fast, consistent design system |
| Fonts | Geist Sans / Geist Mono (numbers) / Instrument Serif italic (headline accents) | "Ledger" look |
| AI extraction | **Anthropic Claude API** (`@anthropic-ai/sdk`), PDF `document` blocks, structured outputs (Zod), streaming, server-side refusal fallbacks | Strong vision + layout reading; handles scanned pages |
| PDF handling | `pdf-lib` (page count, splitting into 5-page chunks, encryption detection) | Pure JS, works on serverless |
| Auth + DB | **Supabase** (Google OAuth + magic link, Postgres with RLS) | One vendor, generous free tier |
| Payments | **Stripe** Checkout + Billing Portal + webhooks | Standard. Note: if the founder's entity is in India, Stripe may be invite-only; consider Lemon Squeezy, Paddle or Dodo Payments as merchant of record (MoR handles global sales tax) |
| Excel | `exceljs`, generated **client-side** and lazy-loaded | No second upload of the data; zero server cost |
| Google Sheets | Our own OAuth (scope `drive.file`, non-sensitive, so no Google security review) + Sheets REST API | Tokens stored AES-GCM-encrypted in an httpOnly cookie, so no DB table is needed |
| Hosting | **Render** web service (Node 24, `render.yaml` Blueprint, Starter plan, health check `/api/health`) | Owner already uses Render. Long-running Node server, so extraction has no serverless time limit |
| Edge / DNS | **Cloudflare** (DNS, proxy/CDN, SSL "Full (strict)", WAF) in front of Render; the domain's nameservers move from Porkbun to Cloudflare | Owner already uses Cloudflare. Free DDoS protection and caching of static assets. Note: Cloudflare cuts proxied requests that are idle for 100s, so `/api/extract` sends `{"type":"ping"}` every 15s |

## 5. Architecture

```
Browser (/convert Workspace)
  │  POST /api/extract (multipart PDF)            ← one request per file, 2 in parallel
  ▼
/api/extract (Node, streams NDJSON events: start → progress → result | error)
  1. auth (Supabase) → 2. validate (%PDF-, ≤25MB, ≤150 pages, not encrypted)
  3. rpc consume_pages (atomic reservation; 402 if not enough)
  4. extractStatement(): split into 5-page chunks → Claude (4 concurrent) → merge
  5. reconcile() → insert into `conversions` (extracted JSON only, never the PDF)
  6. on failure: rpc refund_pages
  ▼
Browser: review table (edit → reconcile() re-runs client-side) → export
  • Excel: exceljs in browser (Transactions / Summary / Categories with SUMIFS formulas)
  • CSV (UTF-8 BOM) • Copy as TSV • Google Sheets via /api/google/sheets (OAuth popup flow)
```

### The reconciliation engine (`src/lib/extraction/reconcile.ts`) — our moat
- A pure function, shared by server and client. Tests: `npm test`.
- Detects statements printed newest-first and flips them to chronological order (using dates, or balance-match
  scoring when all dates are the same).
- Walks the rows: `anchor + Σ(credits − debits) since last printed balance === printed balance`. Rows between two
  printed balances are verified as a group, which handles banks that print one balance per day.
- When a single row mismatches and swapping its debit/credit makes it tie out, the engine swaps them automatically
  and marks the row `fixed`.
- Statement-level check: `opening + credits − debits − closing = difference`.
- Row statuses: `verified | fixed | mismatch | unchecked`. Statement statuses: `verified | partial | mismatch | no_balances`.
- **The prompt tells the model never to compute balances.** This matters: a computed balance would hide extraction errors.

## 6. File map

```
src/
  app/
    page.tsx                 Landing (hero, comparison, features, how, audiences, pricing, security, FAQ, CTA) + JSON-LD
    convert/page.tsx         Converter workspace (server wrapper; ?c=<conversionId> reopens history)
    dashboard/               Plan, pages left, billing portal, conversion history (30 days)
    login/                   Google OAuth + magic link (Supabase)
    pricing/, privacy/, terms/   (privacy/terms are TEMPLATES — get legal review)
    api/extract/             Core extraction endpoint (NDJSON stream)
    api/checkout/            Stripe Checkout (subscription or page pack)
    api/billing-portal/      Stripe customer portal
    api/webhooks/stripe/     invoice.paid (reset quota), subscription.updated/deleted, checkout.session.completed (packs)
    api/google/{connect,callback,sheets}/   Google Sheets export
    api/conversions/[id]/    DELETE a history item
    auth/callback, auth/signout
    sitemap.ts, robots.ts, icon.svg
  components/
    landing/  HeroVisual, Sections (all marketing sections + FAQS data), Pricing (client, monthly/yearly toggle)
    convert/  Workspace (queue, progress, views), ReviewTable (editable grid), ExportBar, Dropzone
    site/     Navbar, AppHeader, Footer, Logo, LegalPage
  lib/
    extraction/ schema.ts (Zod + app types), prompt.ts, extract.ts (server-only), reconcile.ts (pure)
    export/     build.ts (tables, CSV/TSV), xlsx.ts (client)
    supabase/   server.ts (getUser/getProfile/admin), client.ts
    plans.ts, stripe.ts, google.ts, crypto.ts (AES-GCM), env.ts (feature flags), sample.ts (demo statement), ui.ts (btn(), money(), cn())
  proxy.ts                   Next 16 "proxy" (formerly middleware): refreshes Supabase session, guards /dashboard
supabase/migrations/0001_init.sql   profiles, conversions, RLS, signup trigger, consume_pages/refund_pages RPCs
scripts/test-reconcile.ts    Reconciliation unit tests (node runs TS natively)
.env.example                 All env vars, documented
```

## 7. Running locally

```bash
cp .env.example .env.local      # at minimum set ANTHROPIC_API_KEY and APP_SECRET
npm install
npm run dev                     # http://localhost:3000
npm test                        # reconciliation tests
npm run build                   # production build (must pass before deploy)
```
- **Dev mode:** when the Supabase env vars are blank, auth is bypassed with a "dev user", nothing is metered and
  history isn't saved. Only `ANTHROPIC_API_KEY` is needed to try real conversions.
- "Try a sample" on /convert loads a fictional statement (`src/lib/sample.ts`) with no API call. It's useful for UI work
  and doubles as the logged-out demo.

## 8. Launch checklist

- [ ] **Anthropic:** create an API key and set `ANTHROPIC_API_KEY`. Measure $/page (see §3).
- [ ] **Supabase:** create the project, run `supabase/migrations/0001_init.sql`, enable the Google provider and email magic link,
      set Site URL to `https://bankstatementtosheets.com`, and add redirect URL `https://bankstatementtosheets.com/auth/callback`.
      Optional: enable pg_cron and schedule the 30-day purge (SQL at the bottom of the migration).
- [ ] **Stripe:** create products/prices (Starter/Pro/Business × monthly/yearly + Pack 100) and put the price IDs in env.
      Create each price in **USD with `currency_options` for EUR and INR**, using the amounts in the §3 table. In the
      Dashboard this is "Add another currency" on the price. Checkout passes `currency` (see `api/checkout`), so one price
      ID serves all three currencies. If a currency option is missing, Checkout fails for that currency.
      INR caveat: card payments in INR need an Indian Stripe account, or a merchant of record that supports INR.
      Add a webhook to `/api/webhooks/stripe` with events `checkout.session.completed, invoice.paid,
      customer.subscription.updated, customer.subscription.deleted`. Enable the Billing Portal. Consider Stripe Tax.
- [ ] **Google Cloud:** create an OAuth client (Web) with redirect `https://bankstatementtosheets.com/api/google/callback`,
      scope `drive.file`, and publish the consent screen. Enable the Sheets API and Drive API.
- [ ] **Render:** push the repo to GitHub, then Render → New → **Blueprint** → select the repo (reads `render.yaml`).
      Fill in the `sync: false` secrets when prompted. Pick the same region as Supabase. Use the Starter plan or higher,
      because free instances sleep. After the first deploy, add custom domains `bankstatementtosheets.com` and
      `www.bankstatementtosheets.com` under Settings → Custom Domains.
- [ ] **Cloudflare:** add the site to Cloudflare, then change the nameservers at **Porkbun** to the two Cloudflare gives you.
      DNS: apex `CNAME @ → <service>.onrender.com` (Cloudflare flattens it) and `CNAME www → <service>.onrender.com`,
      both proxied (orange cloud). SSL/TLS mode **Full (strict)**, Always Use HTTPS on.
      Turn **Rocket Loader off** (it breaks Next.js scripts). Add a redirect rule from www to the apex.
      For Render to issue its certificate you may need to set the records to DNS-only (grey cloud) briefly,
      then switch back to proxied.
- [ ] Stripe webhook URL and Google OAuth redirect must use the final `https://bankstatementtosheets.com` domain.
- [ ] Email for `support@bankstatementtosheets.com` (Porkbun email forwarding is enough to start).
- [ ] Legal review of the privacy and terms templates. Add a company name and address.
- [ ] Analytics (Cloudflare Web Analytics is free, or Plausible) and error tracking (Sentry). Consider Cloudflare Turnstile on sign-up if free-tier abuse appears.
- [ ] Rate limiting on `/api/extract` beyond credits (for example Upstash) if free-tier abuse appears.
- [ ] OG image (`src/app/opengraph-image.tsx`).

## 9. Roadmap (ordered by expected revenue impact)

1. **Measure accuracy and cost** on 30+ real statements (US, UK, India, EU; digital and scanned). Tune the prompt and model.
2. **SEO landing pages:** `/banks/[bank]` ("Chase statement to Excel") and `/convert/pdf-to-csv` etc. This is the main
   acquisition channel; competitors rank on these terms.
3. **QBO / OFX / QIF export** for QuickBooks and Xero users (accountants ask for it constantly).
4. Password-protected PDFs (accept the password in the UI; decrypt server-side with qpdf/mupdf).
5. Side-by-side PDF preview with click-to-highlight of the source row (needs per-row bounding boxes).
6. Team workspaces (Business plan seats) and a client-folder organization for accountants.
7. Public API with API keys (Business plan) and Zapier.
8. Email-in: forward statements to a unique address and get the sheet back.
9. Image uploads (JPG/PNG phone photos) by converting them to PDF client-side.
10. Cost optimization: use the text layer for digital PDFs; batch API for non-urgent bulk jobs (50% cheaper).

## 10. Conventions & gotchas

- **Next 16:** middleware is `src/proxy.ts`. `cacheComponents` is on, so pages that read cookies/searchParams must render
  that part inside `<Suspense>` (see the `*Inner` pattern in convert/dashboard/login). Don't export `runtime` from route
  files because it's incompatible with cacheComponents. Don't call `new Date()` in prerendered components.
- **Claude API:** use `client.beta.messages.stream` with `betas: ["server-side-fallback-2026-07-01"], fallbacks: "default"`,
  `output_config: { effort, format: zodOutputFormat(schema) }`, then `finalMessage()`. Opus 5.5 can't disable thinking;
  use `effort` to control cost. No assistant prefill. Check `stop_reason` for `refusal` / `max_tokens`.
- Zod is imported from `zod/v4` in extraction code (that's what the SDK helper expects).
- Money values are plain numbers rounded to 2dp. Debit and credit are both positive; the signed `Amount` column is
  computed at export.
- Dates are always ISO `YYYY-MM-DD` strings internally. Excel and Sheets get real date cells.
- Design tokens: `paper #f7f6f1`, `ink #0d1512`, `brand #0b6e4f`, `lime #c8f25a`. Use `btn(variant,size)` from `lib/ui.ts`.
- Never store uploaded PDFs, and never log statement contents. This is a core product promise.
- Don't fabricate testimonials, user counts or ratings on the site. Add them only when they're real.

## 10b. Deployment status (as of 2026-11-05)

- **Repo:** https://github.com/SantamRC/bankstatementtosheets (public, branch `main`, auto-deploys on push).
- **Render:** workspace `bankstatementtosheets` (`tea-dblppg3bc2fs73a2ufc0`), service `srv-dblpu42jnfac73d590s0`,
  live at https://bankstatementtosheets.onrender.com. Plan: **Free** for now (it sleeps after 15 min idle), because the
  workspace has no card yet. **Before launch:** add a card and switch to Starter ($7/mo), then set Health Check Path to
  `/api/health` in Settings (the MCP tool couldn't set it).
- **Env vars set on Render:** NODE_VERSION, NEXT_TELEMETRY_DISABLED, NEXT_PUBLIC_SITE_URL, APP_SECRET (generated),
  EXTRACTION_MODEL, EXTRACTION_EFFORT, STRIPE_AUTOMATIC_TAX. **Missing:** ANTHROPIC_API_KEY, all Supabase, Stripe and
  Google keys. Never set `NODE_ENV` on Render, because `npm ci` would then skip devDependencies and the build fails.
- **Production safety:** until the Supabase env vars are set, `/api/extract` returns 503 "opens very soon" (no
  free, unmetered conversions). The sample demo works.
- **Cloudflare / domain:** not set up yet (see the §8 checklist).
- **Considered and rejected:** hosting on Cloudflare Workers. The free tier's 10 ms CPU limit can't run Next.js or split PDFs,
  128 MB memory is risky for 25 MB PDFs, and Next 16 needs the OpenNext adapter port. Render Starter avoids all of that.

## 11. Decision log

- 2026-11-05 — Project started. Stack: Next 16 + Supabase + Stripe + Claude (`claude-opus-5-5`, env-configurable) + Vercel.
- 2026-11-05 — Differentiator is balance reconciliation with sign-swap auto-fix and an editable review screen.
- 2026-11-05 — Per-page credit pricing; failed jobs are refunded.
- 2026-11-05 — Launch pricing replaced the first draft ($19/$49/$129, 15 free pages): now Free 20 / $9 / $29 / $79 plus
  a $10 pack, with a price lock for anyone who subscribes before 2027-01-31. Margin at full usage depends on the
  model's real $/page (see §3).
- 2026-11-05 — PDFs are processed in memory only. Extracted JSON is kept 30 days in `conversions`.
- 2026-11-05 — Signup is required to convert (prevents free-tier abuse). Logged-out visitors can explore a sample statement.
- 2026-11-05 — Google Sheets uses the `drive.file` scope and cookie-stored encrypted tokens (no DB, no Google security review).
- 2026-11-05 — Pricing shown in USD / EUR / INR via a dropdown (auto-detected from the time zone). EUR uses the same numbers as USD; INR uses ...99 price points (₹799 / ₹2,499 / ₹6,999). Stripe uses one price ID per plan with currency_options.
- 2026-11-05 — Hosting switched from Vercel to **Render** (web service via `render.yaml`) with **Cloudflare** in front (DNS, proxy, SSL). Supabase stays for auth and the database. Added a 15s NDJSON heartbeat for the Cloudflare 100s idle limit, plus `/api/health`.
- 2026-11-05 — Deployed to Render (Free plan for now; switch to Starter before launch). Cloudflare stays as DNS/CDN in front; Cloudflare Workers hosting rejected (CPU and memory limits, adapter port).
