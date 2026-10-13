import { NextResponse } from "next/server";
import { addInquiry } from "@/lib/content";
import { isEmail } from "@/lib/format";
import { fail } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      intent?: string;
      name?: string;
      email?: string;
      organization?: string;
      message?: string;
      company?: string;
    };
    if (String(body.company ?? "").trim()) return NextResponse.json({ ok: true });
    const intent = body.intent === "partner" ? "partner" : "contact";
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const organization = String(body.organization ?? "").trim();
    const message = String(body.message ?? "").trim();
    if (name.length < 2 || name.length > 120) {
      return NextResponse.json({ error: "Enter your name." }, { status: 400 });
    }
    if (!isEmail(email)) {
      return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
    }
    if (organization.length < 2 || organization.length > 160) {
      return NextResponse.json({ error: "Add a subject or organization." }, { status: 400 });
    }
    if (message.length < 8 || message.length > 2000) {
      return NextResponse.json({ error: "Write a short message." }, { status: 400 });
    }
    await addInquiry({ intent, name, email, organization, message });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return fail(error, 503);
  }
}
