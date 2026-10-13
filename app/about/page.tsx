import type { Metadata } from "next";
import Link from "next/link";
import { FESTIVAL, HIGHLIGHTS } from "@/lib/festival";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <p className="kicker">
            <span className="road-sign">Jos</span> The brief
          </p>
          <h1>More than a festival.</h1>
          <p className="lede">
            A destination for music, community, and the December the city already circles on the calendar.
          </p>
        </div>
      </section>
      <section className="section">
        <div className="wrap grid-2">
          <p className="manifesto">{FESTIVAL.manifesto}</p>
          <div>
            <p>
              Out N Loud is built for Jos. The plateau, the cool December air, the streets that already know how to dress for a night out. The website is the front door: the story, the lineup, and a checkout that does not send you somewhere else to buy a ticket.
            </p>
            <p>
              The first edition is {FESTIVAL.dateLabel}. After the night, this place keeps the pictures, the names, and the list, so the next edition does not start from silence.
            </p>
            <Link className="btn" href="/tickets">
              GET TICKETS
            </Link>
          </div>
        </div>
      </section>
      <section className="section dark">
        <div className="wrap grid-3">
          {HIGHLIGHTS.slice(0, 3).map((item) => (
            <article className="panel" key={item.index}>
              <div className="index">{item.index}</div>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
