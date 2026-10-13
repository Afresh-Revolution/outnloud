import type { Metadata } from "next";
import { SubscribeForm } from "@/components/SubscribeForm";
import { getSettings } from "@/lib/content";
import { whatsappHref } from "@/lib/format";

export const metadata: Metadata = { title: "Community" };
export const dynamic = "force-dynamic";

export default async function CommunityPage() {
  const settings = await getSettings();
  const href = whatsappHref(settings.whatsapp_community || "");
  return (
    <section className="page-hero">
      <div className="wrap grid-2">
        <div>
          <p className="kicker">The list</p>
          <h1>Community</h1>
          <p className="lede">
            One email when the lineup moves or tickets open. Add a WhatsApp number and you can be brought into the community chat.
          </p>
          {href && (
            <p>
              <a className="btn" href={href} target="_blank" rel="noreferrer">
                JOIN WHATSAPP
              </a>
            </p>
          )}
        </div>
        <SubscribeForm />
      </div>
    </section>
  );
}
