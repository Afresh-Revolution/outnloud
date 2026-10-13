"use client";

import { useState } from "react";

export function FaqList({ items }: { items: ReadonlyArray<{ q: string; a: string }> }) {
  const [open, setOpen] = useState(0);

  return (
    <div className="faq">
      {items.map((item, index) => {
        const expanded = open === index;
        return (
          <button
            key={item.q}
            type="button"
            aria-expanded={expanded}
            onClick={() => setOpen(expanded ? -1 : index)}
          >
            <strong>{item.q}</strong>
            {expanded && <p>{item.a}</p>}
          </button>
        );
      })}
    </div>
  );
}
