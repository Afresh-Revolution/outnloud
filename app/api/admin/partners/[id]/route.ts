import { NextResponse } from "next/server";
import { removePartner } from "@/lib/content";
import { fail, requireAdmin } from "@/lib/http";

export const runtime = "nodejs";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { id } = await params;
    await removePartner(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return fail(error);
  }
}
