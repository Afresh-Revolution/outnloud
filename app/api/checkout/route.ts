import { NextResponse } from "next/server";
import {
  createGatewavOrder,
  getFestivalEvent,
  prepareOrder,
  siteOrigin,
  startPaystack,
} from "@/lib/gatewav";
import { isEmail } from "@/lib/format";

export const runtime = "nodejs";

type Body = {
  fullName?: string;
  email?: string;
  phone?: string;
  couponCode?: string;
  items?: Array<{ ticketTypeId?: string; quantity?: number }>;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const fullName = String(body.fullName ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const phone = String(body.phone ?? "").trim();
    const couponCode = String(body.couponCode ?? "").trim().toUpperCase();
    if (fullName.length < 2 || fullName.length > 120) {
      return NextResponse.json({ error: "Enter your full name." }, { status: 400 });
    }
    if (!isEmail(email) || email.length > 200) {
      return NextResponse.json({ error: "Enter a valid email for the ticket." }, { status: 400 });
    }

    const event = await getFestivalEvent();
    if (!event) {
      return NextResponse.json({ error: "Tickets are not on sale yet." }, { status: 409 });
    }

    const prepared = prepareOrder(
      event,
      (body.items ?? []).map((item) => ({
        ticketTypeId: String(item.ticketTypeId ?? ""),
        quantity: Number(item.quantity),
      })),
    );

    const paymentMethod = prepared.totalAmount >= 1 ? "paystack" : "manual";
    const order = await createGatewavOrder({
      prepared,
      fullName,
      email,
      phone,
      couponCode: couponCode || undefined,
      paymentMethod,
    });

    if (order.totalAmount < 1) {
      return NextResponse.json({ orderId: order.id, free: true });
    }

    const callbackUrl = `${siteOrigin(req)}/tickets/confirmed?orderId=${encodeURIComponent(order.id)}`;
    const authorizationUrl = await startPaystack({ orderId: order.id, callbackUrl });
    return NextResponse.json({ orderId: order.id, authorizationUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout failed.";
    const status = /not on sale|no longer|only has|between 1 and 20|Choose at least/i.test(message) ? 400 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
