import Link from "next/link";
import { getSettings } from "@/lib/content";
import { FESTIVAL, NAV } from "@/lib/festival";
import { whatsappHref } from "@/lib/format";

export async function Footer() {
  const settings = await getSettings();
  const email = settings.contact_email || "";
  const phone = settings.contact_phone || "";
  const whatsapp = whatsappHref(settings.contact_whatsapp || settings.whatsapp_community || "");
  return (
    <footer className="footer">
      <div className="wrap footer-grid">
        <div>
          <div className="footer-brand">OUT N LOUD</div>
          <p>{FESTIVAL.manifesto}</p>
          <p>
            {FESTIVAL.dateLabel}
            <br />
            {FESTIVAL.city}, {FESTIVAL.region}
          </p>
        </div>
        <div>
          <p className="kicker">Festival</p>
          <ul>
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="kicker">Entry</p>
          <ul>
            <li>Buy on this site</li>
            <li>QR ticket arrives by email</li>
            <li>Show the code at the gate</li>
            {email && (
              <li>
                <a href={`mailto:${email}`}>{email}</a>
              </li>
            )}
            {phone && (
              <li>
                <a href={`tel:${phone}`}>{phone}</a>
              </li>
            )}
            {whatsapp && (
              <li>
                <a href={whatsapp} target="_blank" rel="noreferrer">
                  WhatsApp
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="wrap legal">
        <p>
          © {FESTIVAL.edition} Out N Loud. {FESTIVAL.city}, {FESTIVAL.region}.
        </p>
        <p>
          <a
            className="legal-name"
            href="https://william-lac.vercel.app"
            target="_blank"
            rel="noreferrer"
          >
            W I L L I A M 
          </a>
        </p>
      </div>
    </footer>
  );
}
