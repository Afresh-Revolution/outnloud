"use client";

import { useEffect, useState } from "react";
import type { LineupAct } from "@/lib/content";

const SIZES = ["wide", "slim", "mid", "mid", "slim", "wide"] as const;

export function LineupMasonry({ acts }: { acts: LineupAct[] }) {
  const photos = acts.filter((act) => act.imageUrl);
  const [index, setIndex] = useState<number | null>(null);
  const [startX, setStartX] = useState<number | null>(null);
  const open = index != null ? photos[index] : null;

  useEffect(() => {
    if (index == null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIndex(null);
      if (event.key === "ArrowRight") setIndex((current) => (current == null ? current : (current + 1) % photos.length));
      if (event.key === "ArrowLeft") {
        setIndex((current) => (current == null ? current : (current - 1 + photos.length) % photos.length));
      }
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [index, photos.length]);

  function step(delta: number) {
    setIndex((current) => {
      if (current == null || photos.length < 2) return current;
      return (current + delta + photos.length) % photos.length;
    });
  }

  return (
    <>
      <div className="masonry">
        {acts.map((act, itemIndex) => {
          const photoIndex = photos.findIndex((photo) => photo.id === act.id);
          return (
            <article className={`masonry-card masonry-${SIZES[itemIndex % SIZES.length]}`} key={act.id}>
              {act.imageUrl && (
                <button
                  type="button"
                  className="masonry-open"
                  onClick={() => setIndex(photoIndex)}
                  aria-label={`Open ${act.artist}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="act-photo" src={act.imageUrl} alt="" />
                </button>
              )}
              <div className="masonry-caption">
                <strong>{act.artist}</strong>
                <span>
                  {act.stage}
                  {act.timeLabel ? ` · ${act.timeLabel}` : ""}
                </span>
              </div>
              {act.bio && <p>{act.bio}</p>}
            </article>
          );
        })}
      </div>
      {open && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={open.artist} onClick={() => setIndex(null)}>
          <button type="button" className="lightbox-close" onClick={() => setIndex(null)}>
            Close
          </button>
          {photos.length > 1 && (
            <button
              type="button"
              className="lightbox-nav lightbox-prev"
              aria-label="Previous image"
              onClick={(event) => {
                event.stopPropagation();
                step(-1);
              }}
            >
              ‹
            </button>
          )}
          <figure
            className="lightbox-frame"
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => setStartX(event.clientX)}
            onPointerUp={(event) => {
              if (startX == null) return;
              const delta = event.clientX - startX;
              if (delta > 48) step(-1);
              else if (delta < -48) step(1);
              setStartX(null);
            }}
            onPointerCancel={() => setStartX(null)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={open.imageUrl} alt={open.artist} />
            <figcaption>
              {open.artist}
              <span>
                {open.stage}
                {open.timeLabel ? ` · ${open.timeLabel}` : ""}
              </span>
            </figcaption>
          </figure>
          {photos.length > 1 && (
            <button
              type="button"
              className="lightbox-nav lightbox-next"
              aria-label="Next image"
              onClick={(event) => {
                event.stopPropagation();
                step(1);
              }}
            >
              ›
            </button>
          )}
        </div>
      )}
    </>
  );
}
