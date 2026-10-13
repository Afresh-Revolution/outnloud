import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { verifyGatewavPayment } from "@/lib/gatewav";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { orderId?: string; reference?: string };
    const orderId = String(body.orderId ?? "").trim();
    const reference = String(body.reference ?? "").trim();
    if (!orderId || orderId.length > 80) {
      return NextResponse.json({ error: "Order id is missing." }, { status: 400 });
    }
    const result = await verifyGatewavPayment(orderId, reference || undefined);
    let qrDataUrl = "";
    if (result.ok && result.ticketCode) {
      qrDataUrl = await QRCode.toDataURL(result.ticketCode, {
        margin: 1,
        width: 360,
        color: { dark: "#111111", light: "#ffffff" },
      });
    }
    return NextResponse.json({ ...result, qrDataUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to verify payment.";
    return NextResponse.json({ ok: false, pending: false, error: message }, { status: 502 });
  }
}
