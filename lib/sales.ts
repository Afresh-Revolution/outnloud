import { getFestivalEvent } from "@/lib/gatewav";

export type TicketStat = {
  name: string;
  sold: number;
  price: number;
  revenue: number;
  available: number;
};

export async function getTicketStats() {
  const event = await getFestivalEvent();
  if (!event) {
    return { eventTitle: "", ticketsSold: 0, revenue: 0, tiers: [] as TicketStat[] };
  }
  const tiers = event.tickets
    .filter((ticket) => ticket.type !== "reservation")
    .map((ticket) => ({
      name: ticket.name,
      sold: ticket.sold,
      price: ticket.price,
      revenue: ticket.sold * ticket.price,
      available: ticket.available,
    }));
  return {
    eventTitle: event.title,
    ticketsSold: tiers.reduce((sum, tier) => sum + tier.sold, 0),
    revenue: tiers.reduce((sum, tier) => sum + tier.revenue, 0),
    tiers,
  };
}
