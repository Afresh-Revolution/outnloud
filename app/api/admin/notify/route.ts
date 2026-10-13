import { NextResponse } from "next/server";
import { fail, requireAdmin } from "@/lib/http";
import { emailSubscribers } from "@/lib/mail";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const body = (await req.json()) as { kind?: string; message?: string };
    const message = String(body.message ?? "").trim();
    if (message.length < 8 || message.length > 2000) {
      return NextResponse.json({ error: "Write the note you want the list to receive." }, { status: 400 });
    }
    const subject = body.kind === "lineup" ? "Out N Loud lineup update" : "Out N Loud tickets";
    const mailed = await emailSubscribers(subject, message);
    return NextResponse.json({ ok: true, mailed });
  } catch (error) {
    return fail(error);
  }
}
