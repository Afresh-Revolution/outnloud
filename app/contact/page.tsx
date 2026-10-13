import type { Metadata } from "next";
import { FaqList } from "@/components/FaqList";
import { InquiryForm } from "@/components/InquiryForm";
import { getSettings } from "@/lib/content";
import { FAQS, FESTIVAL } from "@/lib/festival";
import { whatsappHref } from "@/lib/format";

export const metadata: Metadata = { title: "Contact" };
export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const settings = await getSettings();
  const email = settings.contact_email || "";
  const phone = settings.contact_phone || "";
  const whatsapp = whatsappHref(settings.contact_whatsapp || "");
  const venue = [settings.venue_name, settings.venue_address].filter(Boolean).join(", ");
  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <p className="kicker">
            <span className="road-sign">Venue</span> FAQ
          </p>
          <h1>Contact</h1>
          <p className="lede">
            {venue || `${FESTIVAL.city}, ${FESTIVAL.region}. ${FESTIVAL.dateLabel}. The street address goes up with the final gate time.`}
          </p>
          {(email || phone || whatsapp) && (
            <div className="contact-lines">
              {email && (
                <a href={`mailto:${email}`}>{email}</a>
              )}
              {phone && <a href={`tel:${phone}`}>{phone}</a>}
              {whatsapp && (
                <a href={whatsapp} target="_blank" rel="noreferrer">
                  WhatsApp
                </a>
              )}
            </div>
          )}
        </div>
      </section>
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap grid-2">
          <FaqList items={FAQS} />
          <div>
            <p className="kicker">Write to the organizer</p>
            <InquiryForm intent="contact" submitLabel="SEND" />
          </div>
        </div>
      </section>
    </>
  );
}
