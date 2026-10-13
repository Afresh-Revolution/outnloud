import { NextResponse } from "next/server";
import { addSubscriber } from "@/lib/content";
import { digits, isEmail, isPhone } from "@/lib/format";
import { fail } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      name?: string;
      email?: string;
      phone?: string;
      consent?: boolean;
      company?: string;
    };
    if (String(body.company ?? "").trim()) return NextResponse.json({ ok: true });
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const phone = String(body.phone ?? "").trim();
    if (name.length < 2 || name.length > 120) {
      return NextResponse.json({ error: "Enter your name." }, { status: 400 });
    }
    if (!isEmail(email) || email.length > 200) {
      return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
    }
    if (!isPhone(phone)) {
      return NextResponse.json({ error: "Enter a WhatsApp number." }, { status: 400 });
    }
    if (!body.consent) {
      return NextResponse.json({ error: "Confirm that you want the updates." }, { status: 400 });
    }
    await addSubscriber({ name, email, phone: digits(phone) });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return fail(error, 503);
  }
}
