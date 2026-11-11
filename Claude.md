# BankStatementToSheets — project memory

> Read this first in every session. Keep it current: when a decision changes, update the relevant section
> and add a line to the **Decision log** at the bottom.

## 0. Working agreement (set by the owner, 2026-11-06)

- Work autonomously. Ask the owner only when blocked (permissions, logins, payments), and then give exact click steps and wait.
- Keep replies very brief, with no explanations unless asked.
- After every change, commit and push to `main` (Render auto-deploys prod).
- Keep **`Tracker.md`** (pending and done to-dos) current: tick items off and add new ones in the same commit as the work.
- Keep **local** and **prod** separate: `.env.local` plus the dev Supabase project for local; Render env plus the prod Supabase project for prod.
- On every request, check how competitors do it and suggest how we can do better.
- Look for MCPs, skills or connectors that help (see §12).

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
- The source of truth is `PLANS[].price[currency]` and `PAGE_PACK.price` in `src/lib/plans.ts`. `npm run dodo:setup` creates one Dodo product per plan × interval × currency (21) from it.
- **Prices are tax-inclusive** (owner decision 2026-11-08): the buyer pays exactly the advertised price; Dodo remits GST/VAT out of it (≈15% less net revenue on Indian sales, ~17–20% in the EU). Changing a price = edit plans.ts, re-run `dodo:setup` (new names) and update the env IDs.
- **Not done yet:** purchasing-power pricing for India. ₹2,499/mo is a meaningful amount for Indian freelancers.
  If INR conversion is weak, consider cutting INR prices about 40%.

**Launch offer** (`LAUNCH_OFFER` in plans.ts): anyone who subscribes before **2027-01-31** keeps their price for as long as
they stay subscribed. To honour it later, create NEW Dodo products for new customers and point the env at them. Never edit existing
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
- The monthly allowance is granted on `subscription.active/renewed/plan_changed` and refills every month (yearly plans too) via `refresh_allowance()` inside `consume_pages()`. Bonus pages (free signup pages and packs) never expire.
  Monthly pages are spent first.

### ⚠️ Unit economics — not yet measured, VALIDATE BEFORE LAUNCH
**Extraction runs in cascade mode ("verify, then escalate"),** chosen by the owner on 2026-11-05:
1. Every 5-page chunk goes to the **fast model** (`claude-haiku-5-5`, $0.10 in / $0.50 out per million tokens).
2. The statement is reconciled against its own printed balances.
3. Only chunks with rows that don't tie out are re-run on the **strong model** (`claude-opus-5-5`, $4/$20). If the
   statement has no balances at all, or the totals are off with no row to blame, every chunk is re-run. The better
   of the two results is kept. A fast-model error on a chunk is retried on the strong model instead of failing.

**Estimates, not measured:** Haiku costs about $0.001–0.002/page and Opus about $0.03–0.07/page. If around 20% of pages
escalate, the average is about **$0.01/page**, which is a 70–80% margin on the $0.032–0.060/page launch prices.
Opus-only at full plan usage would leave Pro at break-even and Business losing money.

- **Measuring:** each conversion stores `statement.extraction` in `conversions.statement` (models, tokens, $ per call,
  escalated chunks) and logs one line: `[extract] pages=… mode=cascade status=… escalated=1/3 cost=$… ($…/page)`.
  The cost data is stripped before the statement is sent to the browser (`publicStatement()`).
- **Benchmark before launch:** `npm run bench -- --dir bench/statements` (see §7). Compare the verified %, $/page and
  agreement with Opus for cascade vs Haiku-only vs Opus-only.
- **Settings in env, no code change needed:** `EXTRACTION_MODE=cascade|single`, `EXTRACTION_MODEL_FAST`,
  `EXTRACTION_MODEL_STRONG`, `EXTRACTION_EFFORT`. Single mode uses the strong model only.
- **Next cost lever:** for PDFs with a text layer, send extracted text instead of the full page image.
- **Other providers** (Gemini, GPT, Textract/Document AI) were considered. The extractor is pluggable (`ChunkExtractor` in
  `core.ts`), so an adapter can be added and benchmarked. They aren't built yet.

## 4. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 16** (App Router, Turbopack, `cacheComponents` on), React 19, TypeScript | Static landing page for SEO plus API routes in one deploy |
| Styling | Tailwind CSS v4 (tokens in `src/app/globals.css` `@theme`), lucide-react icons | Fast, consistent design system |
| Fonts | Geist Sans / Geist Mono (numbers) / Instrument Serif italic (headline accents) | "Ledger" look |
| AI extraction | **Anthropic Claude API** (`@anthropic-ai/sdk`), PDF `document` blocks, structured outputs (Zod), streaming, server-side refusal fallbacks | Strong vision + layout reading; handles scanned pages |
| PDF handling | `pdf-lib` (page count, splitting into 5-page chunks, encryption detection) | Pure JS, works on serverless |
| Auth + DB | **Supabase** (Google OAuth + magic link, Postgres with RLS) | One vendor, generous free tier |
| Payments | **Dodo Payments** (merchant of record; `dodopayments` SDK): hosted checkout sessions, customer portal, Standard Webhooks | The owner sells as an unregistered individual, so Stripe direct is out; the MoR handles global sales tax and invoices. Products are USD; EUR/INR buyers pay local currency via Dodo Adaptive Pricing |
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
    refunds/, contact/       Refund & Cancellation policy (14-day money-back if <20% used) + contact page (required by MoR onboarding)
    api/extract/             Core extraction endpoint (NDJSON stream)
    api/checkout/            Dodo checkout session (subscription or page pack); metadata carries user_id/kind/pages
    api/billing-portal/      Dodo customer portal
    api/webhooks/dodo/       payment.succeeded (packs), subscription.active/renewed/plan_changed (grant allowance),
                             updated/on_hold/failed (status), cancelled/expired (back to free); idempotent via webhook_events
    api/google/{connect,callback,sheets}/   Google Sheets export
    api/conversions/[id]/    DELETE a history item
    auth/callback, auth/signout
    sitemap.ts (per-group lastmod in UPDATED; bump only the group you changed; no priority/changefreq), robots.ts, icon.svg, opengraph-image.tsx
    banks/, banks/[slug]/    SEO: bank hub + one page per bank (data in lib/seo/banks.ts, static params)
    bank-statement-to-{excel,csv,google-sheets}/, credit-card-statement-to-excel/   SEO format pages (components/seo/FormatPage)
    docuclipper-alternative/, bank-statement-password/, bank-statements-for-mortgage/   SEO comparison + guide pages (GUIDE_LINKS in seo/Blocks)
    guides/ (hub), how-to-download-bank-statement/, how-to-read-a-bank-statement/, bank-reconciliation-template-excel/ (serves public/templates/*.xlsx)
    es/convertir-estado-de-cuenta-pdf-a-excel/, hi/bank-statement-kaise-nikale/   Translated pages; hreflang pairs live in HREFLANG (lib/seo/meta.ts). <main lang=…> since the root <html> is "en"
  components/
    landing/  HeroVisual, Sections (all marketing sections + FAQS data), Pricing (client, monthly/yearly toggle)
    convert/  Workspace (queue, progress, views), ReviewTable (editable grid), ExportBar, Dropzone
    site/     Navbar, AppHeader, Footer, Logo, LegalPage
    seo/      StatementPreview (bank layout → verified output), Blocks (breadcrumbs+schema, hero, FAQ+schema), FormatPage
  lib/
    extraction/ core.ts (engine + cascade, framework-free), extract.ts (server-only re-export for Next),
                schema.ts (Zod + app types), prompt.ts, reconcile.ts (pure)
    export/     build.ts (tables, CSV/TSV), xlsx.ts (client), tally.ts (Tally XML vouchers; pure, tested by scripts/test-tally.ts)
    supabase/   server.ts (getUser/getProfile/admin), client.ts
    seo/        banks.ts (bank page content), samples.ts (fictional regional samples run through reconcile()), meta.ts (pageMeta: title/canonical/OG per page)
    plans.ts, dodo.ts, google.ts, crypto.ts (AES-GCM), env.ts (feature flags), sample.ts (demo statement), ui.ts (btn(), money(), cn())
  proxy.ts                   Next 16 "proxy" (formerly middleware): refreshes Supabase session, guards /dashboard
supabase/migrations/0001_init.sql   profiles, conversions, RLS, signup trigger, consume_pages/refund_pages RPCs
supabase/migrations/0003_dodo_billing.sql   billing_customer_id, subscription_id, monthly_allowance + lazy monthly refill (yearly plans), add_bonus_pages, webhook_events
scripts/test-reconcile.ts    Reconciliation unit tests (node runs TS natively)
scripts/test-cascade.ts      Cascade/escalation tests with a fake model (tsx, no API calls)
scripts/make-reconciliation-template.mts   Regenerates public/templates/bank-reconciliation-template.xlsx (npx tsx …; commit the file)
scripts/indexnow.mjs         IndexNow submit (key file public/f41940a6….txt; the key is public by design)
scripts/benchmark.ts         Model bake-off on real PDFs in bench/statements (git-ignored!)
.env.example                 All env vars, documented
```

## 7. Running locally

```bash
cp .env.example .env.local      # at minimum set ANTHROPIC_API_KEY and APP_SECRET
npm install
npm run dev                     # http://localhost:3000
npm test                        # reconciliation + cascade tests (no API calls)
npm run bench -- --dir bench/statements [--configs cascade,claude-haiku-5-5,claude-opus-5-5] [--save] [--yes]
                                # real API calls on your PDFs. Prints verified %, $/page, latency, escalation rate,
                                # and agreement vs Opus. Asks for --yes if the estimated cost is over $2.
                                # bench/ is git-ignored. NEVER commit real statements.
npm run build                   # production build (must pass before deploy)
npm run indexnow [-- /path ...] # tell Bing/IndexNow pages changed (default: whole live sitemap). Also runs
                                # automatically from .github/workflows/indexnow.yml 5 min after page-changing pushes.
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
- [ ] **Dodo Payments:** verification submitted 2026-11-07 (individual). Run `supabase/migrations/0003_dodo_billing.sql` in prod.
      In **test mode** create 7 products (Starter/Pro/Business × monthly/yearly subscriptions in USD + one-time "Page pack 100"),
      put their IDs in `DODO_PRODUCT_*`, create an API key (`DODO_PAYMENTS_API_KEY`) and a webhook to
      `https://bankstatementtosheets.com/api/webhooks/dodo` (secret → `DODO_PAYMENTS_WEBHOOK_KEY`) with the events listed in
      `api/webhooks/dodo/route.ts`. Enable Adaptive Pricing so EUR/INR buyers pay in their currency. After approval, repeat in
      live mode and set `DODO_PAYMENTS_ENVIRONMENT=live_mode`.
- [ ] **Google Cloud:** create an OAuth client (Web) with redirect `https://bankstatementtosheets.com/api/google/callback`,
      scope `drive.file`, and publish the consent screen. Enable the Sheets API and Drive API.
- [ ] **Render:** push the repo to GitHub, then Render → New → **Blueprint** → select the repo (reads `render.yaml`).
      Fill in the `sync: false` secrets when prompted. Pick the same region as Supabase. Use the Starter plan or higher,
      because free instances sleep. After the first deploy, add custom domains `bankstatementtosheets.com` and
      `www.bankstatementtosheets.com` under Settings → Custom Domains.
- [x] **Cloudflare:** (done 2026-11-06) add the site to Cloudflare, then change the nameservers at **Porkbun** to the two Cloudflare gives you.
      DNS: apex `CNAME @ → <service>.onrender.com` (Cloudflare flattens it) and `CNAME www → <service>.onrender.com`,
      both proxied (orange cloud). SSL/TLS mode **Full (strict)**, Always Use HTTPS on.
      Turn **Rocket Loader off** (it breaks Next.js scripts). Add a redirect rule from www to the apex.
      For Render to issue its certificate you may need to set the records to DNS-only (grey cloud) briefly,
      then switch back to proxied.
- [ ] Dodo webhook URL and Google OAuth redirect must use the final `https://bankstatementtosheets.com` domain.
- [x] Email (done 2026-11-06): **Cloudflare Email Routing** (free, receive-only): `support@` plus a catch-all forward to the owner's Gmail. Don't use Porkbun forwarding, because it stops working once the nameservers move to Cloudflare. To reply *as* support@ later, add Gmail "Send mail as" through an SMTP relay (Resend or Brevo free tier).
- [ ] Legal review of the privacy and terms templates. Add a company name and address.
- [ ] Analytics (Cloudflare Web Analytics is free, or Plausible) and error tracking (Sentry). Consider Cloudflare Turnstile on sign-up if free-tier abuse appears.
- [ ] Rate limiting on `/api/extract` beyond credits (for example Upstash) if free-tier abuse appears.
- [ ] OG image (`src/app/opengraph-image.tsx`).

## 9. Roadmap (ordered by expected revenue impact)

1. **Run `npm run bench`** on 30+ real statements (US, UK, India, EU; digital and scanned). Tune the prompt and the
   cascade settings from the results. Optionally add a Gemini or GPT `ChunkExtractor` and compare.
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
- **Claude API:** stream with `output_config: { effort, format: zodOutputFormat(schema) }`, then `finalMessage()`.
  For Opus 5.x, Sonnet 5.5 and Fable models, use `client.beta.messages.stream` with
  `betas: ["server-side-fallback-2026-07-01"], fallbacks: "default"`. Haiku 5.5 has no server-side fallback, so it uses
  plain `client.messages.stream` (see `supportsFallbacks()` in core.ts). Thinking can't be disabled on Opus 5.5; use
  `effort` to control cost. No assistant prefill. Check `stop_reason` for `refusal` / `max_tokens`.
- `core.ts` must stay free of `server-only` and `@/` path aliases so the tsx scripts can import it.
- Zod is imported from `zod/v4` in extraction code (that's what the SDK helper expects).
- Money values are plain numbers rounded to 2dp. Debit and credit are both positive; the signed `Amount` column is
  computed at export.
- Dates are always ISO `YYYY-MM-DD` strings internally. Excel and Sheets get real date cells.
- Design tokens: `paper #f7f6f1`, `ink #0d1512`, `brand #0b6e4f`, `lime #c8f25a`. Use `btn(variant,size)` from `lib/ui.ts`.
- Never store uploaded PDFs, and never log statement contents. This is a core product promise.
- Don't fabricate testimonials, user counts or ratings on the site. Add them only when they're real.

## 10b. Deployment status (as of 2026-11-05)

- **Repo:** https://github.com/SantamRC/bankstatementtosheets (public, branch `main`, auto-deploys on push).
- **Render (rebuilt 2026-11-07 under santamrcdev404@gmail.com):** workspace "BankStatementToSheets", service `srv-dbn43kei0phs73bgi44g`,
  https://bankstatementtosheets-w4en.onrender.com. Plan **Free** (sleeps after 15 min idle). Created in the dashboard (not the Blueprint),
  so `render.yaml` isn't applied: build `npm ci && npm run build`, start `npm start`, health check `/api/health`, auto-deploy on commit.
  The old workspace (`tea-dblppg3bc2fs73a2ufc0`, old account) was deleted. The Render MCP connector is still authed to the old account,
  so manage this service through the dashboard until the connector is reconnected. **Before launch:** add a card and switch to Starter ($7/mo).
- **Env vars set on Render:** NODE_VERSION, NEXT_TELEMETRY_DISABLED, NEXT_PUBLIC_SITE_URL, APP_SECRET (generated),
  EXTRACTION_MODEL, EXTRACTION_EFFORT, STRIPE_AUTOMATIC_TAX. **Missing:** payment and Google keys. (The owner added ANTHROPIC_API_KEY and SUPABASE_SECRET_KEY on 2026-11-06.) NEXT_PUBLIC_SUPABASE_URL and the publishable key are set. Never set `NODE_ENV` on Render, because `npm ci` would then skip devDependencies and the build fails.
- **Production safety:** until the Supabase env vars are set, `/api/extract` returns 503 "opens very soon" (no
  free, unmetered conversions). The sample demo works.
- **Domain (live 2026-11-06):** https://bankstatementtosheets.com. Nameservers at Porkbun → Cloudflare account **santamrcdev404** (`magnolia` / `yahir.ns.cloudflare.com`, switched 2026-11-07 from the old account's `cesar` / `jocelyn`; the old zone auto-moves). DNS: CNAME `@` and `www` → `bankstatementtosheets-w4en.onrender.com`, both **proxied**. SSL **Full (strict)**. Custom domains added on Render (www 301 → apex, certificate issued by Render).
- **Supabase (prod, 2026-11-06):** org **BankStatementToSheets** (free, sole owner santamrcdev404@gmail.com since 2026-11-07), project `bankstatementtosheets-prod`, ref `rwtmcpotlpnfbaqscuek`, us-west-2 (Oregon, same region as Render). Migrations 0001 and 0002 were applied with the SQL editor. Auth Site URL is `https://bankstatementtosheets.com`, redirect `https://bankstatementtosheets.com/**`. The Supabase MCP connector is still authed to the old account, so manage this project through the dashboard (Chrome). santamrcdev404 owns only this org (1 project as of 2026-11-10), so a second free project (staging) fits in the free plan's 2-active-project limit. KinoKrate is entirely on the old account and unrelated.
- **Auth email (live 2026-11-06):** Supabase custom SMTP → **Brevo** (free, 300/day) via `smtp-relay.brevo.com:587`, login `c1de72001@smtp-brevo.com` (new Brevo account under santamrcdev404, 2026-11-07; old account closed), SMTP key named `supabase-auth`, sender `no-reply@bankstatementtosheets.com`. Domain authenticated in Brevo through Cloudflare Domain Connect. Resend was not used: its free plan allows 1 domain, and kinokrate.com already uses it. The Gmail MCP connector is kinokrate@gmail.com, not the owner's inbox.
- **Staging (2026-11-10):** Render service `srv-dbplv06k1f9s73fi95e0` (Free, auto-deploys `main`) at https://bankstatementtosheets-staging.onrender.com, with Supabase project `bankstatementtosheets-staging` (ref `gjgyercmmddqwnjoqmja`, org BankStatementToSheets, Singapore; migrations 0001+0003 applied; auth Site URL and redirect `…-staging.onrender.com/**`). It uses **Dodo test_mode** keys and the 21 test products, and the Dodo **test-mode webhook** points here, so prod only ever gets live events. Env template: `.env.staging` (git-ignored). Use staging for every billing and email change: subscribe with a Dodo test card, decline cards for failed payments, plan changes, packs, cancellations.
- **Local env:** no Supabase (dev auth bypass, unmetered). A local Supabase via Docker/CLI is possible later. Never point local at prod.
- **Email (live 2026-11-06):** Cloudflare Email Routing. `support@` and a **catch-all** forward to santamrcdev404@gmail.com (Email Routing re-created in the new Cloudflare account on 2026-11-07). MX/SPF/DKIM are managed by Cloudflare. It's receive-only; to reply as support@ later, add Gmail "Send mail as" through an SMTP relay. Use `santam@bankstatementtosheets.com` for vendor signups (Dodo etc.).
- **Considered and rejected:** hosting on Cloudflare Workers. The free tier's 10 ms CPU limit can't run Next.js or split PDFs,
  128 MB memory is risky for 25 MB PDFs, and Next 16 needs the OpenNext adapter port. Render Starter avoids all of that.

## 12. Tooling available to Claude

- **MCP (claude.ai connectors):** Render (services, env vars, deploys, logs), Supabase (projects, migrations, SQL, keys, logs), Cloudflare Developer Platform (Workers/KV/R2/D1 only, no DNS; deprecated, so prefer the Cloudflare API MCP), Gmail, OpenSEO (keyword research, SERP, audits, rank tracking), Claude Docs.
- **Browser:** Claude in Chrome (the owner's signed-in Chrome: Cloudflare, Porkbun, Render, Dodo dashboards). The auto-mode classifier blocks DNS, domain and cert changes, so the owner clicks those. Playwright MCP is for testing localhost.
- **Skills:** openseo:* (keyword-research, competitor-analysis, seo-audit, …), engineering:*, claude-api, dataviz, legal:compliance-check.
- **claude-seo plugin** (AgriciDaniel/claude-seo v2.5.0, user scope, added 2026-11-11): `/seo …` skills and agents for technical SEO, schema, E-E-A-T, GEO/AEO, sitemaps, Core Web Vitals and more. Its PostToolUse hook validates JSON-LD after every Edit/Write (local Python, no network). The optional `seo-cockpit` mod needs Claude Code 2.1.287+.
- **Worth adding:** the Cloudflare API MCP (https://mcp.cloudflare.com/mcp) for DNS/WAF, a Stripe or Dodo MCP when payments go live, and a Sentry MCP once error tracking is set up.

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
- 2026-11-05 — Extraction switched to a **cascade**: Haiku 5.5 first, Opus 5.5 only on chunks that fail reconciliation (approved by the owner). Pluggable `ChunkExtractor`, per-conversion cost tracking (server-only), cascade tests, and `npm run bench`.
- 2026-11-06 — Owner has no registered business and doesn't plan to register one, so Stripe direct is out. Payments will go through a **merchant of record that accepts individuals** (shortlist: Dodo Payments, Polar.sh). Razorpay as an unregistered seller can't take international cards. Provider not chosen yet; `api/checkout` and `api/webhooks/stripe` will need an adapter.
- 2026-11-06 — Domain live on Cloudflare → Render. Cloudflare Email Routing (support@ + catch-all → owner's Gmail). Added /refunds (14-day money-back if under 20% used) and /contact, both required for merchant-of-record onboarding.
- 2026-11-06 — Supabase prod is in its own free org (BankStatementToSheets, Oregon). KinoKrate Staging paused to stay within the free-tier limit. Auth emails need custom SMTP (Resend) because Supabase's default sender only mails team members. Google login is hidden behind `NEXT_PUBLIC_AUTH_GOOGLE` until that provider is set up.
- 2026-11-06 — Auth emails go through Brevo SMTP. The magic-link signup was tested end to end on prod (sent, delivered, clicked).
- 2026-11-06 — Clean descriptions: the model also returns `payee` (short counterparty name) and pulls the main transaction ID (UPI/IMPS/NEFT/cheque) into `reference`. A highlighted lime "Clean payee names" on/off switch (`DescStyleSwitch`, `useDescStyle` in `lib/prefs.ts`, localStorage, **default OFF = bank original**, changed 2026-11-07 at the owner's request) drives the review table and every export. Clean exports keep the full narration in an "Original description" column. Older conversions fall back to the raw narration. Excel money format is now single-section `#,##0.00` with red negatives via conditional formatting (the old `;[Red]-` format showed `--1.00` in Apple Numbers).
- 2026-11-07 — Moving everything for this project off santamdev404@gmail.com to **santamrcdev404@gmail.com** (KinoKrate stays on the old account). Supabase org transferred (new account Owner, old removed). Render rebuilt in a new account (Hobby can't add members); DNS repointed to the new service. Cloudflare zone re-created in the new account from a zone file (records, Full strict, Always HTTPS, Email Routing) and nameservers switched at Porkbun. Brevo: old account closed, new account authenticated the domain and issued a new SMTP key for Supabase. Porkbun (registrar, shared with KinoKrate), Anthropic and GitHub (SantamRC) stay on the old account by owner decision.
- 2026-11-07 — **Dodo Payments** chosen as merchant of record. Verification submitted as an **individual**: Personal Information and Bank Verification approved, Product Information under review (up to 72h). Next: Dodo checkout + webhook adapter to replace the Stripe routes (`api/checkout`, `api/webhooks/stripe`), built and tested in Dodo test mode.
- 2026-11-08 — Stripe code removed; billing now runs on **Dodo Payments** (`lib/dodo.ts`, `api/checkout`, `api/billing-portal`, `api/webhooks/dodo`). Migration 0003 adds Dodo columns, idempotent webhooks and a lazy monthly refill so yearly plans still get pages every month (the old Stripe code only reset on invoices, i.e. yearly for yearly plans).
- 2026-11-08 — Dodo **test-mode purchase verified end to end on prod**: Pro monthly checkout → test card → webhook upgraded the account to Pro (600 monthly pages, renews in a month) → "Manage billing" opens the Dodo customer portal. Render has `DODO_PAYMENTS_ENVIRONMENT=test_mode`, the 7 test product IDs, API key and webhook key. **Open issue:** INR checkout showed ₹2,837.72 + 18% GST = ₹3,348.51 for Pro, while the pricing page says ₹2,499 (Dodo converts $29 at its FX rate + fee, and prices are tax-exclusive).
- 2026-11-08 — Checkout prices now match the pricing page exactly: per-currency (USD/EUR/INR), **tax-inclusive** Dodo products generated from plans.ts; env `DODO_PRODUCT_<PLAN>_<INTERVAL>_<CUR>` / `DODO_PRODUCT_PACK_100_<CUR>`. Verified: Pro monthly INR checkout = ₹2,499.00 incl. GST (was ₹3,348.51). Old 7 USD tax-exclusive test products are unused.
- 2026-11-08 — **SEO pass 1:** 15 bank pages (`/banks/[slug]`), 4 format pages, a `/banks` hub, an OG image, Organization/WebSite/Breadcrumb/FAQ schema, `pageMeta()` on every page, and `llms.txt`. Each bank page shows a fictional sample in that bank's own column layout, reconciled by the real engine. This is our edge over the thin copycat pages that rank today. Rules: column names are labelled "typical", menu paths are hedged, there's a trademark disclaimer on every bank page, and we never use bank logos or branding. Keyword volumes aren't researched yet (OpenSEO has 12 credits). Next: Search Console (owner), more banks ordered by keyword data, audience and comparison pages.
- 2026-11-08 — Google Search Console set up on santamrcdev404 (domain property, sitemap submitted). Bing Webmaster Tools also set up (imported from GSC, sitemap and all URLs submitted), because Bing's index feeds ChatGPT search, Copilot and DuckDuckGo.
- 2026-11-10 — Dodo approved; **live mode** set up: live API key, 21 live tax-inclusive products and the live webhook created with `dodo:setup` into `.env.live` (git-ignored; never commit). Render switches to live once those 24 vars are pasted in.
- 2026-11-10 — **Payments live on prod.** Render uses the live Dodo key, products and webhook. A real ₹799 Starter (INR) purchase upgraded the account via the webhook, and the live customer portal works. Test-mode billing rows were cleared from prod.
- 2026-11-10 — Dodo product names are customer-facing (checkout and invoices): `BankStatementToSheets <Plan> (Monthly|Yearly)`, with the currency kept in `metadata.env_key`. `dodo:setup` matches products by the env-file ID first, then metadata, so it never duplicates (a listing-pagination gap once created 10 duplicates; they were archived).
- 2026-11-10 — Dodo has no custom sender domain: as merchant of record it sends receipts and invoices from its own domain, and we keep those on (the tax invoice must come from the MoR). We add our own branded emails through the **Brevo API** (`BREVO_API_KEY`, `src/lib/email.ts`) from the webhook: welcome, plan change and pack added. They name Dodo and the `DODOPAY_BANKSTATEMENTT` descriptor to head off "unknown charge" chargebacks. Email failures are logged and never fail the webhook.
- 2026-11-10 — Low-pages email (`sendLowPages`, threshold 20% of the monthly allowance, 5 on Free), fired from `/api/extract` after a successful conversion when the balance crosses the threshold. No DB flag: only successful conversions count, so each crossing emails once. Dodo's own plan-change email is off; ours replaces it.
- 2026-11-10 — All customer billing emails are ours except Dodo's receipt/invoice, refund and cancellation emails. Payment failed = webhook `subscription.on_hold`. Renewal reminder = yearly plans only, 7 days ahead, from a daily GitHub Action (`cron.yml`) calling `/api/cron/renewal-reminders` with `CRON_SECRET`. Monthly plans get no reminder, because a monthly nudge mostly drives churn.
- 2026-11-10 — Correction: the Supabase 2-project limit is per account. santamrcdev404 has just 1 project, so a free staging project is possible; KinoKrate (old account) doesn't count.
- 2026-11-10 — Added a **staging** environment (Render Free + a second free Supabase project + Dodo test mode) so billing flows can be tested end to end without real money. `dodo:setup` now picks the webhook URL by mode (live → prod, test → staging).
- 2026-11-11 — **Keyword research** (OpenSEO, US + IN): the head term is "bank statement converter" (US 1,300/mo KD 6; IN 33,100 KD 16), so the homepage is retitled around it. Per-bank terms are ≤10/mo, so bank pages are long-tail support. On-page pass: question-keyword FAQs, internal link block, 8 more banks (23 total), plus `/docuclipper-alternative`, `/bank-statement-password` and `/bank-statements-for-mortgage`. No keyword stuffing: each phrase appears naturally in a title, heading or FAQ. The comparison page is honest about where DocuClipper is stronger (QBO/OFX, integrations, SOC 2).
- 2026-11-11 — **Guides + first translated pages** (keyword data via OpenSEO): `/guides` hub; `/how-to-download-bank-statement` ("how to get bank statement" US 5,400 KD 11; "how to download bank statement" 480 KD 7), `/how-to-read-a-bank-statement` (210, KD 1), `/bank-reconciliation-template-excel` (480, KD 0) with a free .xlsx. Languages chosen by data, not by guess: Spanish/Mexico "convertir estado de cuenta (pdf) a excel" ≈1,000/mo KD 0–3 → one es-MX page paired with /bank-statement-to-excel. Hindi converter searches don't exist (Indians search in English), but "बैंक स्टेटमेंट कैसे निकाले" is 2,900/mo KD 0 → a hi-IN download guide paired with the English one. German, French and Portuguese bank-statement terms are ≤40/mo, so skipped. Translated pages say honestly that the app UI is English and prices are in USD.
- 2026-11-11 — **Tally export** (India SEO + accountant demand): TallyPrime's bank-statement import rejects Excel/CSV converted from PDFs, so we export **Tally XML vouchers** (money out → Payment, in → Receipt, against a ledger named "Cash" → Contra). Users name the bank ledger, a default counter ledger (Suspense) and optional category → ledger mapping (`TallyDialog`, saved in localStorage). Ledgers must already exist in Tally; the dialog lists them. Landing page `/bank-statement-to-tally`. Not yet tested in a real Tally install.
