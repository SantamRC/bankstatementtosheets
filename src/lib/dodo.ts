import "server-only";
import DodoPayments from "dodopayments";

/** Dodo Payments (merchant of record). Test vs live is config only: DODO_PAYMENTS_ENVIRONMENT=test_mode|live_mode. */
let client: DodoPayments | null = null;
export const getDodo = () =>
  (client ??= new DodoPayments({
    bearerToken: process.env.DODO_PAYMENTS_API_KEY,
    environment: process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode" ? "live_mode" : "test_mode",
    webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY ?? null,
  }));
