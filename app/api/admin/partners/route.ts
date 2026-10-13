import { NextResponse } from "next/server";
import { addPartner } from "@/lib/content";
import { isCloudinaryUrl } from "@/lib/cloudinary";
import { fail, requireAdmin } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const body = (await req.json()) as {
      name?: string;
      tier?: string;
      website?: string;
      logoUrl?: string;
      cloudinaryId?: string;
    };
    const name = String(body.name ?? "").trim();
    if (name.length < 2) return NextResponse.json({ error: "Enter the partner name." }, { status: 400 });
    const logoUrl = String(body.logoUrl ?? "").trim();
    const cloudName = (process.env.CLOUDINARY_CLOUD_NAME ?? "").trim();
    if (logoUrl && !isCloudinaryUrl(logoUrl, cloudName)) {
      return NextResponse.json({ error: "Logos have to come from Cloudinary." }, { status: 400 });
    }
    await addPartner({
      name: name.slice(0, 140),
      tier: String(body.tier ?? "").trim().slice(0, 40),
      website: String(body.website ?? "").trim().slice(0, 300),
      logoUrl,
      cloudinaryId: logoUrl ? String(body.cloudinaryId ?? "").trim() : "",
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return fail(error);
  }
}
