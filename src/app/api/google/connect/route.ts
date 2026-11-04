import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { GOOGLE_REDIRECT, GOOGLE_SCOPES } from "@/lib/google";
import { isGoogleConfigured } from "@/lib/env";

export async function GET() {
  if (!isGoogleConfigured) return new NextResponse("Google export isn't configured yet.", { status: 503 });
  const state = randomBytes(16).toString("hex");
  (await cookies()).set("bsts_gstate", state, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 });
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: GOOGLE_REDIRECT,
    response_type: "code",
    scope: GOOGLE_SCOPES,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  }).toString();
  return NextResponse.redirect(url);
}
