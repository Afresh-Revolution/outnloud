"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Flash } from "@/components/Flash";
import { PageLoader } from "@/components/PageLoader";
import { naira } from "@/lib/format";

const CHECKOUT_KEY = "outnloud_checkout";

type CheckoutItem = {
  ticketTypeId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

type Selection = {
  eventId: string;
  eventTitle: string;
  items: CheckoutItem[];
};

export function CheckoutForm({ onSale }: { onSale: boolean }) {
  const [selection, setSelection] = useState<Selection | null>(null);
  const [ready, setReady] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [appliedCode, setAppliedCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponNote, setCouponNote] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(CHECKOUT_KEY);
      if (raw) setSelection(JSON.parse(raw) as Selection);
    } catch {
      setSelection(null);
    }
    setReady(true);
  }, []);

  const subtotal = useMemo(
    () => selection?.items.reduce((sum, item) => sum + item.lineTotal, 0) ?? 0,
    [selection],
  );
  const payable = Math.max(0, subtotal - discount);

  async function applyCoupon() {
    setCouponNote("");
    setError("");
    const code = coupon.trim().toUpperCase();
    if (!code) {
      setDiscount(0);
      setAppliedCode("");
      return;
    }
    const res = await fetch("/api/coupon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, totalAmount: subtotal }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setDiscount(0);
      setAppliedCode("");
      setCouponNote(body.error || "That coupon is not valid.");
      return;
    }
    setAppliedCode(code);
    setDiscount(Number(body.discountAmount) || 0);
    setCouponNote(body.discountAmount ? `Coupon applied. You save ${naira(body.discountAmount)}.` : "Coupon applied.");
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selection) return;
    const data = new FormData(event.currentTarget);
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: data.get("fullName"),
          email: data.get("email"),
          phone: data.get("phone"),
          couponCode: appliedCode,
          items: selection.items.map((item) => ({
            ticketTypeId: item.ticketTypeId,
            quantity: item.quantity,
          })),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Checkout failed.");
      if (body.authorizationUrl) {
        window.location.assign(body.authorizationUrl);
        return;
      }
      if (body.orderId) {
        window.location.assign(`/tickets/confirmed?orderId=${encodeURIComponent(body.orderId)}&free=1`);
        return;
      }
      throw new Error("Checkout did not return a payment link.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed.");
      setLoading(false);
    }
  }

  if (!ready) return <PageLoader label="Finding your tickets" />;
  if (!onSale) {
    return <p className="notice">Tickets are not on sale yet.</p>;
  }
  if (!selection || selection.items.length === 0) {
    return (
      <p className="notice">
        No tickets selected. <a href="/tickets">Choose a tier</a> first.
      </p>
    );
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <div className="panel">
        <p className="kicker">{selection.eventTitle}</p>
        {selection.items.map((item) => (
          <p key={item.ticketTypeId}>
            {item.quantity} × {item.name}
            <strong> {naira(item.lineTotal)}</strong>
          </p>
        ))}
        <p>
          To pay <strong>{payable === 0 ? "Free" : naira(payable)}</strong>
        </p>
      </div>
      <label className="field">
        <span>Full name</span>
        <input name="fullName" autoComplete="name" maxLength={120} required />
      </label>
      <label className="field">
        <span>Email for the ticket</span>
        <input name="email" type="email" autoComplete="email" maxLength={200} required />
      </label>
      <label className="field">
        <span>Phone (optional)</span>
        <input name="phone" type="tel" autoComplete="tel" maxLength={30} />
      </label>
      <div className="field">
        <span>Coupon</span>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            value={coupon}
            onChange={(event) => {
              setCoupon(event.target.value);
              setAppliedCode("");
              setDiscount(0);
            }}
            maxLength={40}
            aria-label="Coupon code"
          />
          <button type="button" className="btn secondary" onClick={applyCoupon}>
            APPLY
          </button>
        </div>
        {couponNote && <p>{couponNote}</p>}
      </div>
      {error && <Flash message={error} tone="error" onDone={() => setError("")} />}
      <button className="btn" type="submit" disabled={loading}>
        {loading ? "STARTING PAYMENT" : payable === 0 ? "GET TICKET" : "PAY NOW"}
      </button>
      <p className="lede">
        Payment opens on Paystack, then brings you straight back here. Your QR ticket is emailed after the payment is confirmed.
      </p>
    </form>
  );
}
