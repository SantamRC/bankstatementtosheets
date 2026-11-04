import "server-only";
import Stripe from "stripe";

let stripe: Stripe | null = null;
export const getStripe = () => (stripe ??= new Stripe(process.env.STRIPE_SECRET_KEY!));
