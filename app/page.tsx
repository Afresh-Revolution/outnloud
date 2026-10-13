import Link from "next/link";
import { Countdown } from "@/components/Countdown";
import { SubscribeForm } from "@/components/SubscribeForm";
import { LineupMasonry } from "@/components/LineupMasonry";
import { listLineup, listPartners } from "@/lib/content";
import { FESTIVAL, HIGHLIGHTS } from "@/lib/festival";
import { formatTime, formatWhen, naira, plainText } from "@/lib/format";
import { getFestivalEvent } from "@/lib/gatewav";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let event = null;
  try {
    event = await getFestivalEvent();
  } catch {
    event = null;
  }
  const [acts, partners] = await Promise.all([listLineup(), listPartners()]);
  const startsAt = event?.date || FESTIVAL.startsAt;
  const when = event?.date ? formatWhen(event.date) : FESTIVAL.dateLabel;
  const place = event?.location || `${FESTIVAL.city}, ${FESTIVAL.region}`;

  return (
    <>
      <section className="hero">
        <div className="wrap hero-inner">
          <div className="hero-meta">
            <span className="road-sign">Jos</span>
            <span>{place}</span>
            <span>{when}</span>
            {event?.startTime && <span>{formatTime(event.startTime)}</span>}
          </div>
          <h1 className="hero-title">
            <span>Out</span>
            <span className="hero-n">n</span>
            <span>Loud</span>
          </h1>
          <p className="hero-copy">{FESTIVAL.manifesto}</p>
          <div className="hero-actions">
            <Link className="btn" href="/tickets">
              GET TICKETS
            </Link>
            <Link className="btn secondary" href="/about">
              THE STORY
            </Link>
          </div>
          <Countdown startsAt={startsAt} />
        </div>
      </section>
      <div className="marquee">
        <div className="marquee-track">
          {Array.from({ length: 2 }).map((_, copy) => (
            <span key={copy} aria-hidden={copy === 1 ? true : undefined}>
              JOS · MUSIC · CULTURE · 26 DEC 2026 · PLATEAU · OUT N LOUD · COMMUNITY ·{" "}
              <a href="https://joscity.com" target="_blank" rel="noreferrer">
                JOSCITY.COM
              </a>
              {" · "}
              <a href="https://gatewav.com" target="_blank" rel="noreferrer">
                GATEWAV.COM
              </a>
              {" · "}
            </span>
          ))}
        </div>
      </div>
      <section className="section">
        <div className="wrap grid-2">
          <div>
            <p className="kicker">
              <span className="road-sign">01</span> The night
            </p>
            <p className="manifesto">{FESTIVAL.manifesto}</p>
          </div>
          <div>
            <p className="lede">
              Out N Loud is a December gathering in Jos: music, street culture, and the people who already make the city loud. One edition this year. A date the city can keep.
            </p>
            {acts.length > 0 && <LineupMasonry acts={acts.slice(0, 6)} />}
            <p>
              <Link className="btn" href="/lineup">
                LINEUP
              </Link>
            </p>
          </div>
        </div>
      </section>
      <section className="section dark">
        <div className="wrap">
          <p className="kicker">Why people come</p>
          <div className="grid-4">
            {HIGHLIGHTS.map((item) => (
              <article className="panel" key={item.index}>
                <div className="index">{item.index}</div>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="wrap grid-2">
          <div>
            <p className="kicker">Tickets</p>
            <h2 className="display" style={{ fontSize: "clamp(3rem, 8vw, 5.5rem)", textTransform: "uppercase" }}>
              Choose a tier. Pay here.
            </h2>
            <p className="lede">
              Checkout stays on this site. The QR ticket is issued for the gate and sent to your email.
            </p>
          </div>
          <div className="stub-list">
            {event && event.tickets.length > 0 ? (
              event.tickets.slice(0, 3).map((ticket) => (
                <article className="stub" key={ticket.id}>
                  <div>
                    <h3>{ticket.name}</h3>
                    <p>{plainText(ticket.description) || `${ticket.available} available`}</p>
                  </div>
                  <div className="price">{ticket.price === 0 ? "Free" : naira(ticket.price)}</div>
                </article>
              ))
            ) : (
              <article className="stub">
                <div>
                  <h3>On sale soon</h3>
                  <p>Tiers appear here as soon as the event is open in the ticketing system.</p>
                </div>
              </article>
            )}
            <Link className="btn" href="/tickets">
              SEE TICKETS
            </Link>
          </div>
        </div>
      </section>
      {partners.length > 0 && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="wrap">
            <p className="kicker">Partners</p>
            <div className="partner-row">
              {partners.map((partner) => (
                <div key={partner.id}>
                  {partner.logoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={partner.logoUrl} alt="" />
                  )}
                  <span>{partner.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      <section className="section dark">
        <div className="wrap grid-2">
          <div>
            <p className="kicker">Community</p>
            <h2 className="display" style={{ fontSize: "clamp(3rem, 7vw, 4.5rem)", textTransform: "uppercase" }}>
              Hear it before the poster does.
            </h2>
            <p className="lede">Lineup drops, ticket windows, and the memories after the night.</p>
          </div>
          <SubscribeForm />
        </div>
      </section>
    </>
  );
}
