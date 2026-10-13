import { NextResponse } from "next/server";
import { signUpload } from "@/lib/cloudinary";
import { fail, requireAdmin } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const body = (await req.json().catch(() => ({}))) as { resourceType?: string };
    const resourceType = body.resourceType === "video" ? "video" : "image";
    return NextResponse.json({ ...signUpload(), resourceType });
  } catch (error) {
    return fail(error, 503);
  }
}
