import { NextResponse } from "next/server";
import { getFestivalEvent, previewCoupon } from "@/lib/gatewav";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { code?: string; totalAmount?: number };
    const code = String(body.code ?? "").trim().toUpperCase();
    const totalAmount = Number(body.totalAmount);
    if (!code) return NextResponse.json({ error: "Enter a coupon code." }, { status: 400 });
    if (!Number.isFinite(totalAmount) || totalAmount < 0) {
      return NextResponse.json({ error: "Ticket total is missing." }, { status: 400 });
    }
    const event = await getFestivalEvent();
    if (!event) return NextResponse.json({ error: "Tickets are not on sale yet." }, { status: 409 });
    const preview = await previewCoupon(event.id, code, totalAmount);
    return NextResponse.json(preview);
  } catch (error) {
    const message = error instanceof Error ? error.message : "That coupon is not valid.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
