import type { Metadata } from "next";
import { listGallery } from "@/lib/content";
import { PAST_EXPERIENCE } from "@/lib/photos";

export const metadata: Metadata = { title: "Gallery" };
export const dynamic = "force-dynamic";

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
              ? "Photographs and short film from the festival, with earlier nights below."
              : "Photographs from earlier nights. Pictures and film from this edition will join them here."}
          </p>
        </div>
      </section>
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          {items.length > 0 && (
            <div className="gallery-grid" style={{ marginBottom: "3.5rem" }}>
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
          )}
          <h2 id="past-experience" style={{ fontSize: "clamp(2.6rem, 7vw, 4.5rem)", textTransform: "uppercase", marginBottom: "1.2rem" }}>
            Past experience
          </h2>
          <div className="gallery-grid">
            {PAST_EXPERIENCE.map((photo) => (
              <article className="gallery-card" key={photo.src}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.src} alt={photo.alt} />
                <p>
                  <strong>{photo.title}</strong>
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
