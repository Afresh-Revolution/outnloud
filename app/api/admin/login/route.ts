import { NextResponse } from "next/server";
import { createAdminToken, credentialsMatch } from "@/lib/auth";
import { adminCookie } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { email?: string; password?: string };
  const email = String(body.email ?? "");
  const password = String(body.password ?? "");
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD || !process.env.ADMIN_SESSION_SECRET) {
    return NextResponse.json(
      { error: "Set ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_SESSION_SECRET in the environment." },
      { status: 503 },
    );
  }
  if (!credentialsMatch(email, password)) {
    return NextResponse.json({ error: "Those details do not match." }, { status: 401 });
  }
  const token = createAdminToken();
  if (!token) {
    return NextResponse.json({ error: "Session secret is missing." }, { status: 503 });
  }
  const cookie = adminCookie(token);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(cookie.name, cookie.value, cookie.options);
  return response;
}
