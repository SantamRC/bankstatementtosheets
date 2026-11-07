/**
 * One-time Dodo Payments setup (idempotent): creates the 7 products and the webhook endpoint, then writes their IDs
 * and the webhook signing key into the env file. Run per mode (test first, then live after approval):
 *
 *   npm run dodo:setup                        # reads/writes .env.local (DODO_PAYMENTS_API_KEY + DODO_PAYMENTS_ENVIRONMENT)
 *   npm run dodo:setup -- --env .env.live     # e.g. a separate file holding the live_mode key
 *
 * Prices come from src/lib/plans.ts (USD/EUR/INR, tax-inclusive). Never prints secrets.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import DodoPayments from "dodopayments";
import { CURRENCIES, PAGE_PACK, PLANS, productEnvKey, type Currency } from "../src/lib/plans.ts";

const envFile = process.argv.includes("--env") ? process.argv[process.argv.indexOf("--env") + 1] : ".env.local";
const WEBHOOK_URL = "https://bankstatementtosheets.com/api/webhooks/dodo";
const EVENTS = [
  "payment.succeeded",
  "subscription.active",
  "subscription.renewed",
  "subscription.plan_changed",
  "subscription.updated",
  "subscription.on_hold",
  "subscription.failed",
  "subscription.cancelled",
  "subscription.expired",
] as const;

// Built from src/lib/plans.ts so checkout prices can't drift from the pricing page. One product per plan × interval ×
// currency, all tax-inclusive: the buyer pays exactly the advertised price and Dodo remits GST/VAT out of it.
type Def = { env: string; name: string; amount: number; currency: Currency; yearly?: boolean; pack?: boolean; description: string };
const PRODUCTS: Def[] = [];
for (const { code: currency } of CURRENCIES) {
  for (const plan of PLANS.filter((p) => p.id !== "free")) {
    for (const interval of ["monthly", "yearly"] as const) {
      const perMonth = plan.price[currency][interval];
      PRODUCTS.push({
        env: productEnvKey(plan.id, interval, currency),
        name: `${plan.name} (${interval}) · ${currency}`,
        amount: Math.round((interval === "yearly" ? perMonth * 12 : perMonth) * 100),
        currency,
        yearly: interval === "yearly",
        description: `${plan.pages.toLocaleString("en-US")} pages / month${interval === "yearly" ? ", billed yearly" : ""}`,
      });
    }
  }
  PRODUCTS.push({
    env: productEnvKey("pack", "monthly", currency),
    name: `Page pack (${PAGE_PACK.pages} pages) · ${currency}`,
    amount: Math.round(PAGE_PACK.price[currency] * 100),
    currency,
    pack: true,
    description: `${PAGE_PACK.pages} extra pages that never expire`,
  });
}

function readEnv(file: string): Record<string, string> {
  if (!existsSync(file)) throw new Error(`${file} not found`);
  const out: Record<string, string> = {};
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

function writeEnv(file: string, values: Record<string, string>) {
  let text = readFileSync(file, "utf8");
  for (const [k, v] of Object.entries(values)) {
    const re = new RegExp(`^${k}=.*$`, "m");
    text = re.test(text) ? text.replace(re, `${k}=${v}`) : `${text.replace(/\n?$/, "\n")}${k}=${v}\n`;
  }
  writeFileSync(file, text);
}

const env = readEnv(envFile);
if (!env.DODO_PAYMENTS_API_KEY) throw new Error(`Set DODO_PAYMENTS_API_KEY in ${envFile} first.`);
const mode = env.DODO_PAYMENTS_ENVIRONMENT === "live_mode" ? "live_mode" : "test_mode";
const dodo = new DodoPayments({ bearerToken: env.DODO_PAYMENTS_API_KEY, environment: mode });
console.log(`Dodo ${mode} — writing IDs to ${envFile}`);

const existing = new Map<string, string>();
for await (const p of dodo.products.list()) if (p.name) existing.set(p.name, p.product_id);

const updates: Record<string, string> = {};
for (const d of PRODUCTS) {
  let id = existing.get(d.name);
  if (!id) {
    const created = await dodo.products.create({
      name: d.name,
      description: d.description,
      tax_category: "saas",
      price: d.pack
        ? { type: "one_time_price", currency: d.currency, price: d.amount, discount: 0, purchasing_power_parity: false, tax_inclusive: true }
        : {
            type: "recurring_price",
            currency: d.currency,
            price: d.amount,
            discount: 0,
            purchasing_power_parity: false,
            tax_inclusive: true,
            payment_frequency_count: 1,
            payment_frequency_interval: d.yearly ? "Year" : "Month",
            subscription_period_count: 20,
            subscription_period_interval: "Year",
          },
    });
    id = created.product_id;
    console.log(`  created  ${d.name.padEnd(32)} ${id}`);
  } else console.log(`  exists   ${d.name.padEnd(32)} ${id}`);
  updates[d.env] = id;
}

let hook: { id: string } | undefined;
for await (const w of dodo.webhooks.list()) if (w.url === WEBHOOK_URL) hook = w;
if (!hook) {
  hook = await dodo.webhooks.create({ url: WEBHOOK_URL, description: "bankstatementtosheets billing", filter_types: [...EVENTS] });
  console.log(`  created  webhook ${WEBHOOK_URL}`);
} else console.log(`  exists   webhook ${WEBHOOK_URL}`);
updates.DODO_PAYMENTS_WEBHOOK_KEY = (await dodo.webhooks.retrieveSecret(hook.id)).secret;

writeEnv(envFile, updates);
console.log(`Done. ${Object.keys(updates).length} values written to ${envFile} (webhook key not printed).`);
