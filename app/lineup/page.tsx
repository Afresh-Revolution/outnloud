import type { Metadata } from "next";
import Link from "next/link";
import { LineupMasonry } from "@/components/LineupMasonry";
import { STAGES } from "@/lib/festival";
import { listLineup } from "@/lib/content";

export const metadata: Metadata = { title: "Lineup" };
export const dynamic = "force-dynamic";

export default async function LineupPage() {
  const acts = await listLineup();
  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <p className="kicker">Artists · stages · hours</p>
          <h1>Lineup</h1>
          <p className="lede">
            {acts.length > 0
              ? "The bill so far. More names land in waves, and the list hears it first."
              : "Names land in waves. The stages are set. The first announcement will be published here and sent to the community list."}
          </p>
        </div>
      </section>
      <section className="section">
        <div className="wrap">
          {acts.length > 0 ? (
            <LineupMasonry acts={acts} />
          ) : (
            <div className="grid-3">
              {STAGES.map((stage) => (
                <article className="panel" key={stage.name}>
                  <p className="kicker">{stage.window}</p>
                  <h2 style={{ fontSize: "2.4rem", textTransform: "uppercase" }}>{stage.name}</h2>
                  <p>{stage.detail}</p>
                  <p>
                    <strong>Artists to be announced</strong>
                  </p>
                </article>
              ))}
            </div>
          )}
          <p style={{ marginTop: "2rem" }}>
            <Link className="btn" href="/community">
              GET THE DROP
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
