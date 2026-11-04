import "server-only";
import { cookies } from "next/headers";
import { seal, unseal } from "@/lib/crypto";
import { SITE_URL } from "@/lib/env";

export const GOOGLE_COOKIE = "bsts_g";
// drive.file = only files this app creates. Non-sensitive scope, so no Google security review needed.
export const GOOGLE_SCOPES = "https://www.googleapis.com/auth/drive.file";
export const GOOGLE_REDIRECT = `${SITE_URL}/api/google/callback`;

interface Tokens {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
}

export async function saveTokens(t: Tokens) {
  (await cookies()).set(GOOGLE_COOKIE, seal(JSON.stringify(t)), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
}

/** Returns a valid access token, refreshing if needed, or null if the user must (re)connect. */
export async function getAccessToken(): Promise<string | null> {
  const raw = (await cookies()).get(GOOGLE_COOKIE)?.value;
  const tokens = raw ? (JSON.parse(unseal(raw) ?? "null") as Tokens | null) : null;
  if (!tokens) return null;
  if (tokens.expires_at > Date.now() + 60_000) return tokens.access_token;
  if (!tokens.refresh_token) return null;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: tokens.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) return null;
  const j = (await res.json()) as { access_token: string; expires_in: number };
  await saveTokens({ access_token: j.access_token, refresh_token: tokens.refresh_token, expires_at: Date.now() + j.expires_in * 1000 });
  return j.access_token;
}

export async function exchangeCode(code: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: GOOGLE_REDIRECT,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error("token exchange failed");
  const j = (await res.json()) as { access_token: string; refresh_token?: string; expires_in: number };
  await saveTokens({ access_token: j.access_token, refresh_token: j.refresh_token, expires_at: Date.now() + j.expires_in * 1000 });
}
