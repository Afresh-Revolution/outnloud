import type { Metadata } from "next";
import { Anton, Caveat, DM_Sans } from "next/font/google";
import { headers } from "next/headers";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { requestIsAdminHost } from "@/lib/admin-host";
import { FESTIVAL } from "@/lib/festival";
import "./globals.css";

export const dynamic = "force-dynamic";

const display = Anton({ weight: "400", subsets: ["latin"], variable: "--font-display" });
const body = DM_Sans({ subsets: ["latin"], variable: "--font-body" });
const script = Caveat({ subsets: ["latin"], variable: "--font-script" });

export const metadata: Metadata = {
  title: {
    default: "Out N Loud 2026 · Jos",
    template: "%s · Out N Loud",
  },
  description: `${FESTIVAL.manifesto} ${FESTIVAL.dateLabel}, ${FESTIVAL.city}.`,
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL
    ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
    : undefined,
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const host = (await headers()).get("host");
  const adminSite = requestIsAdminHost(host);

  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${script.variable}`}>
      <body>
        {adminSite ? (
          <main id="content">{children}</main>
        ) : (
          <>
            <a className="skip" href="#content">
              Skip to content
            </a>
            <Header />
            <main id="content">{children}</main>
            <Footer />
          </>
        )}
      </body>
    </html>
  );
}
