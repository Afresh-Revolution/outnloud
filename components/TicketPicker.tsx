"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { FestivalTicket } from "@/lib/gatewav";
import { naira } from "@/lib/format";
import { linePrice } from "@/lib/pricing";

const CHECKOUT_KEY = "outnloud_checkout";

export function TicketPicker({
  eventId,
  eventTitle,
  tickets,
}: {
  eventId: string;
  eventTitle: string;
  tickets: FestivalTicket[];
}) {
  const router = useRouter();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const sellable = tickets.filter((ticket) => ticket.type !== "reservation");
  const reservations = tickets.filter((ticket) => ticket.type === "reservation");

  const summary = useMemo(() => {
    let count = 0;
    let total = 0;
    let saved = 0;
    const items = sellable
      .filter((ticket) => (quantities[ticket.id] ?? 0) > 0)
      .map((ticket) => {
        const quantity = quantities[ticket.id] ?? 0;
        const line = linePrice(ticket.price, quantity, ticket.discountTiers);
        count += quantity;
        total += line.finalAmount;
        saved += line.discountAmount;
        return {
          ticketTypeId: ticket.id,
          name: ticket.name,
          quantity,
          unitPrice: ticket.price,
          lineTotal: line.finalAmount,
        };
      });
    return { count, total, saved, items };
  }, [quantities, sellable]);

  function setQty(ticket: FestivalTicket, next: number) {
    const capped = Math.min(ticket.available, Math.max(0, next));
    setQuantities((current) => ({ ...current, [ticket.id]: capped }));
  }

  function continueCheckout() {
    sessionStorage.setItem(
      CHECKOUT_KEY,
      JSON.stringify({ eventId, eventTitle, items: summary.items }),
    );
    router.push("/checkout");
  }

  return (
    <div>
      <div className="stub-list">
        {sellable.map((ticket) => {
          const quantity = quantities[ticket.id] ?? 0;
          const soldOut = ticket.available < 1;
          return (
            <article className="stub" key={ticket.id}>
              <div>
                <p className="kicker">Admit one</p>
                <h3>{ticket.name}</h3>
                {ticket.description && <p>{ticket.description}</p>}
                <p>{soldOut ? "Sold out" : `${ticket.available} left`}</p>
              </div>
              <div>
                <div className="price">{ticket.price === 0 ? "Free" : naira(ticket.price)}</div>
                <div className="stepper">
                  <button type="button" aria-label={`Fewer ${ticket.name}`} disabled={soldOut} onClick={() => setQty(ticket, quantity - 1)}>
                    −
                  </button>
                  <span className="qty">{quantity}</span>
                  <button type="button" aria-label={`More ${ticket.name}`} disabled={soldOut || quantity >= ticket.available} onClick={() => setQty(ticket, quantity + 1)}>
                    +
                  </button>
                </div>
              </div>
            </article>
          );
        })}
        {reservations.map((ticket) => (
          <article className="stub" key={ticket.id}>
            <div>
              <p className="kicker">Reservation</p>
              <h3>{ticket.name}</h3>
              <p>{ticket.description || "This tier is arranged directly with the organizer."}</p>
              {ticket.contactEmail && <p>{ticket.contactEmail}</p>}
              {ticket.contactPhone && <p>{ticket.contactPhone}</p>}
            </div>
          </article>
        ))}
      </div>
      {sellable.length > 0 && (
        <div className="checkout-bar">
          <div>
            <strong>
              {summary.count} ticket{summary.count === 1 ? "" : "s"}
            </strong>
            <div>{summary.total === 0 ? "Free" : naira(summary.total)}</div>
            {summary.saved > 0 && <div>Quantity saving {naira(summary.saved)}</div>}
          </div>
          <button type="button" className="btn" disabled={summary.count === 0} onClick={continueCheckout}>
            {summary.total === 0 ? "CONTINUE" : "CHECKOUT"}
          </button>
        </div>
      )}
    </div>
  );
}
