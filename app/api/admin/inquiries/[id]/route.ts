import { NextResponse } from "next/server";
import { setInquiryStatus } from "@/lib/content";
import { fail, requireAdmin } from "@/lib/http";

export const runtime = "nodejs";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const body = (await req.json()) as { status?: string };
    if (body.status !== "accepted" && body.status !== "declined") {
      return NextResponse.json({ error: "Choose accept or decline." }, { status: 400 });
    }
    const { id } = await params;
    await setInquiryStatus(id, body.status);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return fail(error);
  }
}
