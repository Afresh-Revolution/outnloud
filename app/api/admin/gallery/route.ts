import { NextResponse } from "next/server";
import { addGallery } from "@/lib/content";
import { isCloudinaryUrl } from "@/lib/cloudinary";
import { fail, requireAdmin } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const body = (await req.json()) as {
      kind?: string;
      title?: string;
      caption?: string;
      url?: string;
      cloudinaryId?: string;
    };
    const url = String(body.url ?? "").trim();
    const cloudName = (process.env.CLOUDINARY_CLOUD_NAME ?? "").trim();
    if (!isCloudinaryUrl(url, cloudName)) {
      return NextResponse.json({ error: "Upload the file to Cloudinary first." }, { status: 400 });
    }
    const kind = body.kind === "video" ? "video" : "image";
    await addGallery({
      kind,
      title: String(body.title ?? "").trim().slice(0, 120),
      caption: String(body.caption ?? "").trim().slice(0, 240),
      url,
      cloudinaryId: String(body.cloudinaryId ?? "").trim(),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return fail(error);
  }
}
