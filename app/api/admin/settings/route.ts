import { NextResponse } from "next/server";
import { saveSettings } from "@/lib/content";
import { fail, requireAdmin } from "@/lib/http";

export const runtime = "nodejs";

const KEYS = [
  "contact_email",
  "contact_phone",
  "contact_whatsapp",
  "venue_name",
  "venue_address",
  "whatsapp_community",
] as const;

export async function PUT(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const next: Record<string, string> = {};
    for (const key of KEYS) {
      if (key in body) next[key] = String(body[key] ?? "").trim().slice(0, 300);
    }
    await saveSettings(next);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return fail(error);
  }
}
