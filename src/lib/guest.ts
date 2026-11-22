import "server-only";
import { createHash } from "node:crypto";
import { FREE_PAGES } from "@/lib/plans";

/**
 * "Try without an account": a visitor can convert the first GUEST_MAX_PAGES pages of a statement and see the verified
 * result; downloading needs a free account. Abuse limits are in memory (one Render instance; a deploy resets them),
 * which is enough at this scale: per-IP, a global daily cap that bounds the worst-case model spend, and Turnstile
 * when its keys are set. Nothing is stored, and the IP is only kept as a salted hash until the window ends.
 */
export const GUEST_ENABLED = process.env.GUEST_TRIAL !== "off";
export const GUEST_MAX_PAGES = Number(process.env.GUEST_MAX_PAGES || 5);
const PER_IP = Number(process.env.GUEST_PER_IP_PER_DAY || 2);
const DAILY_CAP = Number(process.env.GUEST_DAILY_CAP || 50);
const DAY = 24 * 60 * 60 * 1000;

const byIp = new Map<string, number[]>();
let day = { start: Date.now(), count: 0 };

export function clientIp(req: Request): string {
  const h = req.headers;
  return h.get("cf-connecting-ip") || h.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
}

const key = (ip: string) => createHash("sha256").update(`${process.env.APP_SECRET ?? ""}:${ip}`).digest("hex").slice(0, 32);

function prune(now: number) {
  if (now - day.start > DAY) day = { start: now, count: 0 };
  for (const [k, times] of byIp) {
    const kept = times.filter((t) => now - t < DAY);
    if (kept.length) byIp.set(k, kept);
    else byIp.delete(k);
  }
}

/** Reserve a guest conversion for this IP. Returns an error message, or null when allowed. */
export function reserveGuest(ip: string): string | null {
  const now = Date.now();
  prune(now);
  const k = key(ip);
  const times = byIp.get(k) ?? [];
  if (times.length >= PER_IP) return `You've used the free try for today. Create a free account to keep converting: ${FREE_PAGES} pages free, no card.`;
  if (day.count >= DAILY_CAP) return `The free try is busy right now. Create a free account to convert: ${FREE_PAGES} pages free, no card.`;
  times.push(now);
  byIp.set(k, times);
  day.count++;
  return null;
}

/** Give a reservation back when the conversion fails, like refund_pages for accounts. */
export function releaseGuest(ip: string) {
  const k = key(ip);
  const times = byIp.get(k);
  if (times?.length) times.pop();
  day.count = Math.max(0, day.count - 1);
}

/** Cloudflare Turnstile check; skipped (true) when TURNSTILE_SECRET_KEY isn't set. */
export async function verifyTurnstile(token: string | null, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip !== "unknown") body.set("remoteip", ip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
    const data = (await res.json()) as { success?: boolean };
    return Boolean(data.success);
  } catch {
    return false;
  }
}
