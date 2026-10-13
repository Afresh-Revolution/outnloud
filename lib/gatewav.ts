/**
 * White-label client for the Gatewav ticketing API.
 * Buyers stay on Out N Loud. This server creates the order, starts Paystack,
 * and asks Gatewav to verify payment and issue the QR ticket.
 */

export type DiscountTier = {
  minimumQuantity: number;
  discountPercent: number;
};

export type FestivalTicket = {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  sold: number;
  available: number;
  type: "paid" | "free" | "reservation";
  contactEmail: string;
  contactPhone: string;
  discountTiers: DiscountTier[];
};

export type FestivalEvent = {
  id: string;
  title: string;
  description: string;
  date: string;
  venue: string;
  location: string;
  imageUrl: string;
  category: string;
  startTime: string;
  tickets: FestivalTicket[];
};

type RawRecord = Record<string, unknown>;

function apiBase(): string {
  return (process.env.GATEWAV_API_URL || "https://ticketing-back.onrender.com").replace(/\/$/, "");
}

function asRecord(value: unknown): RawRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as RawRecord;
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function ticketType(raw: RawRecord): FestivalTicket["type"] {
  const kind = text(raw.type).toLowerCase();
  if (kind === "reservation" || kind === "free" || kind === "paid") return kind;
  return num(raw.price) === 0 ? "free" : "paid";
}

function discountTiers(value: unknown): DiscountTier[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((tier) => {
      const row = asRecord(tier);
      if (!row) return null;
      const minimumQuantity = Math.trunc(num(row.minimumQuantity));
      const discountPercent = num(row.discountPercent);
      if (minimumQuantity < 2 || discountPercent <= 0 || discountPercent > 100) return null;
      return { minimumQuantity, discountPercent };
    })
    .filter((tier): tier is DiscountTier => tier !== null)
    .sort((a, b) => a.minimumQuantity - b.minimumQuantity);
}

function normalizeTicket(value: unknown): FestivalTicket | null {
  const raw = asRecord(value);
  if (!raw || !text(raw.id)) return null;
  const quantity = Math.max(0, Math.trunc(num(raw.quantity)));
  const sold = Math.max(0, Math.trunc(num(raw.sold)));
  return {
    id: text(raw.id),
    name: text(raw.name) || text(raw.ticketName) || "Ticket",
    description: text(raw.description),
    price: Math.max(0, num(raw.price)),
    quantity,
    sold,
    available: Math.max(0, quantity - sold),
    type: ticketType(raw),
    contactEmail: text(raw.contactEmail),
    contactPhone: text(raw.contactPhone),
    discountTiers: discountTiers(raw.discountTiers),
  };
}

function normalizeEvent(value: unknown): FestivalEvent | null {
  const raw = asRecord(value);
  if (!raw || !text(raw.id)) return null;
  const ticketsRaw = raw.tickets ?? raw.ticketTypes;
  const tickets = Array.isArray(ticketsRaw)
    ? ticketsRaw.map(normalizeTicket).filter((ticket): ticket is FestivalTicket => ticket !== null)
    : [];
  return {
    id: text(raw.id),
    title: text(raw.title) || "Out N Loud",
    description: text(raw.description),
    date: text(raw.date),
    venue: text(raw.venue),
    location: text(raw.location) || text(raw.venue),
    imageUrl: text(raw.imageUrl),
    category: text(raw.category),
    startTime: text(raw.startTime),
    tickets,
  };
}

async function gatewavFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${apiBase()}${path}`, {
    ...init,
    cache: "no-store",
    signal: AbortSignal.timeout(25000),
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
}

async function readJson(res: Response): Promise<RawRecord> {
  const data = await res.json().catch(() => ({}));
  return asRecord(data) ?? {};
}

export async function getFestivalEvent(): Promise<FestivalEvent | null> {
  const configured = process.env.GATEWAV_EVENT_ID?.trim();
  if (configured) {
    const res = await gatewavFetch(`/api/events/${encodeURIComponent(configured)}`);
    if (!res.ok) return null;
    return normalizeEvent(await res.json());
  }

  const res = await gatewavFetch("/api/events?take=100");
  if (!res.ok) return null;
  const data = await res.json();
  const list = Array.isArray(data) ? data : [];
  const match = list.find((item) => /out\s*n\s*loud/i.test(text(asRecord(item)?.title)));
  const id = text(asRecord(match)?.id);
  if (!id) return null;
  const detail = await gatewavFetch(`/api/events/${encodeURIComponent(id)}`);
  if (!detail.ok) return normalizeEvent(match);
  return normalizeEvent(await detail.json());
}

export type OrderItemInput = {
  ticketTypeId: string;
  quantity: number;
};

export type PreparedOrder = {
  event: FestivalEvent;
  items: Array<{
    ticketTypeId: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  originalAmount: number;
  totalAmount: number;
};

export function prepareOrder(event: FestivalEvent, requested: OrderItemInput[]): PreparedOrder {
  if (!Array.isArray(requested) || requested.length === 0) {
    throw new Error("Choose at least one ticket.");
  }

  const items: PreparedOrder["items"] = [];
  let originalAmount = 0;
  let totalAmount = 0;

  for (const row of requested) {
    const quantity = Math.trunc(Number(row.quantity));
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
      throw new Error("Each ticket quantity must be between 1 and 20.");
    }
    const ticket = event.tickets.find((item) => item.id === row.ticketTypeId);
    if (!ticket) throw new Error("One of the selected tickets is no longer available.");
    if (ticket.type === "reservation") {
      throw new Error(`${ticket.name} is reserved through the organizer, not online checkout.`);
    }
    if (quantity > ticket.available) {
      throw new Error(`${ticket.name} only has ${ticket.available} left.`);
    }

    const lineOriginal = ticket.price * quantity;
    const sorted = [...ticket.discountTiers].sort((a, b) => a.minimumQuantity - b.minimumQuantity);
    let appliedPercent = 0;
    for (const tier of sorted) {
      if (quantity < tier.minimumQuantity) break;
      appliedPercent = tier.discountPercent;
    }
    const lineDiscount = appliedPercent ? Math.round((lineOriginal * appliedPercent) / 100) : 0;

    originalAmount += lineOriginal;
    totalAmount += Math.max(0, lineOriginal - lineDiscount);
    items.push({
      ticketTypeId: ticket.id,
      name: ticket.name,
      quantity,
      price: ticket.price,
    });
  }

  return { event, items, originalAmount, totalAmount };
}

function errorMessage(data: RawRecord, fallback: string): string {
  return text(data.error) || text(data.message) || fallback;
}

function readOrderId(data: RawRecord): string {
  const nested = asRecord(data.order);
  return text(data.id) || text(data.orderId) || text(nested?.id);
}

export async function createGatewavOrder(input: {
  prepared: PreparedOrder;
  fullName: string;
  email: string;
  phone: string;
  couponCode?: string;
  paymentMethod: "paystack" | "manual";
}): Promise<{ id: string; totalAmount: number }> {
  const res = await gatewavFetch("/api/orders", {
    method: "POST",
    body: JSON.stringify({
      eventId: input.prepared.event.id,
      items: input.prepared.items,
      originalAmount: input.prepared.originalAmount,
      totalAmount: input.prepared.totalAmount,
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      address: "",
      couponCode: input.couponCode || undefined,
      paymentMethod: input.paymentMethod,
    }),
  });
  const data = await readJson(res);
  if (!res.ok) throw new Error(errorMessage(data, "Could not create the order."));
  const id = readOrderId(data);
  if (!id) throw new Error("The order was created without an id.");
  const nested = asRecord(data.order);
  const totalAmount = num(data.totalAmount ?? nested?.totalAmount ?? input.prepared.totalAmount);
  return { id, totalAmount };
}

export async function startPaystack(input: {
  orderId: string;
  callbackUrl: string;
}): Promise<string> {
  const res = await gatewavFetch("/api/orders/initialize-payment", {
    method: "POST",
    body: JSON.stringify(input),
  });
  const data = await readJson(res);
  if (!res.ok) throw new Error(errorMessage(data, "Could not start payment."));
  const url = text(data.authorizationUrl) || text(data.authorization_url);
  if (!url) throw new Error("Payment did not return a checkout link.");
  return url;
}

export async function previewCoupon(eventId: string, code: string, totalAmount: number) {
  const res = await gatewavFetch("/api/orders/coupon-preview", {
    method: "POST",
    body: JSON.stringify({ eventId, code, couponCode: code, totalAmount }),
  });
  const data = await readJson(res);
  if (!res.ok) throw new Error(errorMessage(data, "That coupon is not valid."));
  const pricing = asRecord(data.pricing);
  const finalAmount = num(pricing?.finalAmount ?? data.finalAmount ?? totalAmount);
  const discountAmount = num(pricing?.discountAmount ?? data.discountAmount);
  return { finalAmount, discountAmount, code };
}

export type Verification = {
  ok: boolean;
  pending: boolean;
  status: string;
  message: string;
  ticketCode: string;
  email: string;
  totalAmount: number | null;
};

function findTicketCode(value: unknown): string {
  const row = asRecord(value);
  if (!row) return "";
  if (text(row.ticketCode)) return text(row.ticketCode);
  if (row.order) return findTicketCode(row.order);
  return "";
}

export async function verifyGatewavPayment(orderId: string, reference?: string): Promise<Verification> {
  const res = await gatewavFetch("/api/orders/verify", {
    method: "POST",
    body: JSON.stringify({ orderId, reference: reference || undefined }),
  });
  const data = await readJson(res);
  const nested = asRecord(data.order);
  const status = (text(data.status) || text(nested?.status) || (res.ok ? "paid" : "failed")).toLowerCase();
  const pending = status === "pending" || status === "processing";
  const failed = !res.ok || ["failed", "cancelled", "canceled", "abandoned"].includes(status);
  return {
    ok: res.ok && !failed && !pending,
    pending: res.ok && pending,
    status,
    message: errorMessage(data, res.ok ? "Payment received." : "Unable to verify payment."),
    ticketCode: findTicketCode(data),
    email: text(data.email) || text(nested?.email),
    totalAmount: data.totalAmount != null || nested?.totalAmount != null
      ? num(data.totalAmount ?? nested?.totalAmount)
      : null,
  };
}

export function siteOrigin(req: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "http";
  if (host) return `${proto}://${host}`;
  return new URL(req.url).origin;
}
