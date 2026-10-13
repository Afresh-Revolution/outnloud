import { createHash, createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "onl_admin";

function sessionSecret(): string {
  return (process.env.ADMIN_SESSION_SECRET ?? "").trim();
}

function sign(payload: string): string {
  const mac = createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
  return `${payload}.${mac}`;
}

export function createAdminToken(): string | null {
  if (!sessionSecret()) return null;
  const exp = String(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return sign(exp);
}

export function tokenIsValid(token: string | undefined): boolean {
  if (!token || !sessionSecret()) return false;
  const dot = token.lastIndexOf(".");
  if (dot < 1) return false;
  const payload = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  const expected = sign(payload).slice(payload.length + 1);
  const left = Buffer.from(mac);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return false;
  return Number(payload) > Date.now();
}

export async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  return tokenIsValid(jar.get(ADMIN_COOKIE)?.value);
}

export function credentialsMatch(email: string, password: string): boolean {
  const expectedEmail = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const expectedPassword = process.env.ADMIN_PASSWORD ?? "";
  if (!expectedEmail || !expectedPassword || !sessionSecret()) return false;
  const emailOk = safeEqual(digest(email.trim().toLowerCase()), digest(expectedEmail));
  const passwordOk = safeEqual(digest(password), digest(expectedPassword));
  return emailOk && passwordOk;
}

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

function safeEqual(left: Buffer, right: Buffer) {
  return left.length === right.length && timingSafeEqual(left, right);
}
