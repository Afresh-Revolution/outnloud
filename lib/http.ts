import { NextResponse } from "next/server";
import { ADMIN_COOKIE, isAdmin } from "@/lib/auth";

export function adminCookie(token: string) {
  return {
    name: ADMIN_COOKIE,
    value: token,
    options: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    },
  };
}

export async function requireAdmin() {
  if (await isAdmin()) return null;
  return NextResponse.json({ error: "Sign in required." }, { status: 401 });
}

export function fail(error: unknown, status = 400) {
  const message = error instanceof Error ? error.message : "Something went wrong.";
  const database = /DATABASE_URL|ECONNREF|password authentication|timeout/i.test(message);
  return NextResponse.json({ error: message }, { status: database ? 503 : status });
}
