import type { Metadata } from "next";
import { listGallery } from "@/lib/content";

export const metadata: Metadata = { title: "Gallery" };
export const dynamic = "force-dynamic";

const FRAMES = [
  { title: "Main stage", note: "The wide shot" },
  { title: "City stage", note: "Closer" },
  { title: "Crowd", note: "Jos, in it" },
  { title: "Afterhours", note: "Still going" },
  { title: "Daylight", note: "Before the noise" },
];

export default async function GalleryPage() {
  const items = await listGallery();
  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <p className="kicker">Pictures · film · the morning after</p>
          <h1>Gallery</h1>
          <p className="lede">
            {items.length > 0
              ? "Photographs and short film from the festival."
              : "Photographs and film from the night will live here. Until they are added, these frames stay empty on purpose."}
          </p>
        </div>
      </section>
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          {items.length > 0 ? (
            <div className="gallery-grid">
              {items.map((item) => (
                <article className="gallery-card" key={item.id}>
                  {item.kind === "video" ? (
                    <video src={item.url} controls playsInline preload="metadata" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.url} alt={item.title || "Festival photograph"} />
                  )}
                  <p>
                    <strong>{item.title || (item.kind === "video" ? "Film" : "Photograph")}</strong>
                    {item.caption ? ` — ${item.caption}` : ""}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <div className="frames">
              {FRAMES.map((frame) => (
                <article className="frame" key={frame.title}>
                  <div>
                    <div className="kicker">{frame.note}</div>
                    <strong>{frame.title}</strong>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
