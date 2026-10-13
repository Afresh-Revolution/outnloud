import type { Metadata } from "next";
import { InquiryForm } from "@/components/InquiryForm";
import { listPartners } from "@/lib/content";

export const metadata: Metadata = { title: "Partners" };
export const dynamic = "force-dynamic";

const PACKAGES = [
  {
    name: "City",
    copy: "Presence across the grounds and the site. For brands that want to be in the crowd, not above it.",
  },
  {
    name: "Stage",
    copy: "A stage association, on-site branding, and a mention when that stage is announced.",
  },
  {
    name: "Presenting",
    copy: "The lead mark beside Out N Loud for this edition, online and at the gate.",
  },
];

export default async function PartnersPage() {
  const partners = await listPartners();
  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <p className="kicker">Sponsors</p>
          <h1>Partners</h1>
          <p className="lede">
            The festival is looking for brands that belong in Jos in December. Tell us who you are and which room you want.
          </p>
        </div>
      </section>
      {partners.length > 0 && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="wrap">
            <p className="kicker">With us</p>
            <div className="partner-row">
              {partners.map((partner) => {
                const inner = (
                  <>
                    {partner.logoUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={partner.logoUrl} alt="" />
                    )}
                    <span>{partner.name}</span>
                  </>
                );
                return partner.website ? (
                  <a key={partner.id} href={partner.website} target="_blank" rel="noreferrer">
                    {inner}
                  </a>
                ) : (
                  <div key={partner.id}>{inner}</div>
                );
              })}
            </div>
          </div>
        </section>
      )}
      <section className="section" style={{ paddingTop: partners.length > 0 ? undefined : 0 }}>
        <div className="wrap grid-2">
          <div className="grid-3" style={{ gridTemplateColumns: "1fr" }}>
            {PACKAGES.map((item) => (
              <article className="panel" key={item.name}>
                <h2 style={{ fontSize: "2rem", textTransform: "uppercase" }}>{item.name}</h2>
                <p>{item.copy}</p>
              </article>
            ))}
          </div>
          <InquiryForm intent="partner" submitLabel="SEND INQUIRY" />
        </div>
      </section>
    </>
  );
}
