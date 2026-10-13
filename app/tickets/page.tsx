import type { Metadata } from "next";
import Link from "next/link";
import { TicketPicker } from "@/components/TicketPicker";
import { FESTIVAL } from "@/lib/festival";
import { formatTime, formatWhen, plainText } from "@/lib/format";
import { getFestivalEvent } from "@/lib/gatewav";

export const metadata: Metadata = { title: "Tickets" };
export const dynamic = "force-dynamic";

export default async function TicketsPage() {
  let event = null;
  let loadError = "";
  try {
    event = await getFestivalEvent();
  } catch {
    loadError = "The ticket system is waking up. Refresh in a moment.";
  }

  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <p className="kicker">
            <span className="road-sign">Admit</span> {event ? formatWhen(event.date) : FESTIVAL.dateLabel}
          </p>
          <h1>Tickets</h1>
          <p className="lede">
            Pick a tier and pay on this page. Paystack takes the payment, then you return here. The QR ticket is emailed to you and scanned at the gate.
          </p>
        </div>
      </section>
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap grid-2">
          <div>
            {event?.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={event.imageUrl} alt="" style={{ width: "100%", border: "1.5px solid #111" }} />
            )}
            <p>
              <strong>{event?.location || `${FESTIVAL.city}, ${FESTIVAL.region}`}</strong>
              {event?.startTime ? ` · ${formatTime(event.startTime)}` : ""}
            </p>
            <p>{event ? plainText(event.description) : "Venue details will be confirmed closer to the day and sent to ticket holders."}</p>
            <p>
              <Link href="/contact">Questions and entry notes</Link>
            </p>
          </div>
          <div>
            {loadError && <p className="error">{loadError}</p>}
            {!loadError && !event && (
              <div className="notice">
                <p>Tickets open soon.</p>
                <p>Tiers appear here as soon as sales are opened for Out N Loud.</p>
              </div>
            )}
            {event && (
              <TicketPicker eventId={event.id} eventTitle={event.title} tickets={event.tickets} />
            )}
          </div>
        </div>
      </section>
    </>
  );
}
