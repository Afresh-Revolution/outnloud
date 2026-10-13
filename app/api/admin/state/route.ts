import { NextResponse } from "next/server";
import { listGallery, listInquiries, listLineup, listPartners, listSubscribers, getSettings } from "@/lib/content";
import { fail, requireAdmin } from "@/lib/http";
import { getTicketStats } from "@/lib/sales";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const [settings, lineup, gallery, partners, inquiries, subscribers, sales] = await Promise.all([
      getSettings(),
      listLineup(),
      listGallery(),
      listPartners(),
      listInquiries(),
      listSubscribers(),
      getTicketStats().catch(() => ({ eventTitle: "", ticketsSold: 0, revenue: 0, tiers: [] })),
    ]);
    return NextResponse.json({ settings, lineup, gallery, partners, inquiries, subscribers, sales });
  } catch (error) {
    return fail(error);
  }
}
