import { NextResponse } from "next/server";
import { addLineup } from "@/lib/content";
import { isCloudinaryUrl } from "@/lib/cloudinary";
import { fail, requireAdmin } from "@/lib/http";
import { emailSubscribers } from "@/lib/mail";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const body = (await req.json()) as {
      artist?: string;
      stage?: string;
      timeLabel?: string;
      bio?: string;
      imageUrl?: string;
      cloudinaryId?: string;
      notify?: boolean;
      note?: string;
    };
    const artist = String(body.artist ?? "").trim();
    const stage = String(body.stage ?? "").trim();
    if (artist.length < 2 || artist.length > 120) {
      return NextResponse.json({ error: "Enter the artist name." }, { status: 400 });
    }
    if (!stage || stage.length > 80) {
      return NextResponse.json({ error: "Choose a stage." }, { status: 400 });
    }
    const imageUrl = String(body.imageUrl ?? "").trim();
    const cloudName = (process.env.CLOUDINARY_CLOUD_NAME ?? "").trim();
    if (imageUrl && !isCloudinaryUrl(imageUrl, cloudName)) {
      return NextResponse.json({ error: "Artist photos have to come from Cloudinary." }, { status: 400 });
    }
    await addLineup({
      artist,
      stage,
      timeLabel: String(body.timeLabel ?? "").trim().slice(0, 80),
      bio: String(body.bio ?? "").trim().slice(0, 600),
      imageUrl,
      cloudinaryId: imageUrl ? String(body.cloudinaryId ?? "").trim() : "",
    });
    let mailed = 0;
    let mailError = "";
    if (body.notify) {
      const note = String(body.note ?? "").trim();
      try {
        mailed = await emailSubscribers(
          `Out N Loud lineup: ${artist}`,
          note || `${artist} is on the ${stage} lineup. See the full bill on the festival site.`,
        );
      } catch (error) {
        mailError = error instanceof Error ? error.message : "The artist was saved, but the email did not send.";
      }
    }
    return NextResponse.json({ ok: true, mailed, mailError });
  } catch (error) {
    return fail(error);
  }
}
