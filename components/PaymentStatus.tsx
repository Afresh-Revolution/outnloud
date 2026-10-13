"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageLoader } from "@/components/PageLoader";
import { naira } from "@/lib/format";

type VerifyResponse = {
  ok?: boolean;
  pending?: boolean;
  message?: string;
  ticketCode?: string;
  qrDataUrl?: string;
  email?: string;
  totalAmount?: number | null;
  error?: string;
};

export function PaymentStatus({
  orderId,
  reference,
  free,
}: {
  orderId: string;
  reference: string;
  free: boolean;
}) {
  const [state, setState] = useState<"checking" | "paid" | "pending" | "failed">("checking");
  const [detail, setDetail] = useState<VerifyResponse>({});

  useEffect(() => {
    if (!orderId) {
      setState("failed");
      setDetail({ message: "This confirmation link is missing an order." });
      return;
    }
    let cancelled = false;
    let attempts = 0;

    async function check() {
      attempts += 1;
      try {
        const res = await fetch("/api/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, reference }),
        });
        const body = (await res.json().catch(() => ({}))) as VerifyResponse;
        if (cancelled) return;
        if (body.ok || free) {
          setDetail(body.ok ? body : { ...body, message: body.message || "Your free ticket is issued." });
          setState("paid");
          sessionStorage.removeItem("outnloud_checkout");
          return;
        }
        if (body.pending && attempts < 8) {
          setState("pending");
          window.setTimeout(check, 2000);
          return;
        }
        setDetail(body);
        setState(body.pending ? "pending" : "failed");
      } catch {
        if (cancelled) return;
        if (free) {
          setDetail({ message: "Your free ticket is issued. Check your email for the QR code." });
          setState("paid");
          return;
        }
        setDetail({ message: "Could not reach the ticket system. Refresh this page in a moment." });
        setState("failed");
      }
    }

    void check();
    return () => {
      cancelled = true;
    };
  }, [orderId, reference, free]);

  const title = state === "paid" ? "You are in" : "Payment not confirmed";

  if (state === "checking" || state === "pending") {
    return <PageLoader label="Checking your ticket" />;
  }

  return (
    <div className="ticket-pass">
      <p className="kicker">Out N Loud</p>
      <h2 className="display" style={{ fontSize: "3rem", textTransform: "uppercase" }}>
        {title}
      </h2>
      <p>
        {state === "paid"
          ? "Your ticket is issued. A copy is on its way to your email. Show the QR at the gate."
          : detail.message || detail.error || "Hold on while the payment is checked."}
      </p>
      {state === "paid" && detail.email && (
        <p>
          Sent to <strong>{detail.email}</strong>
        </p>
      )}
      {state === "paid" && detail.totalAmount != null && (
        <p>{detail.totalAmount === 0 ? "Free ticket" : `Paid ${naira(detail.totalAmount)}`}</p>
      )}
      {detail.qrDataUrl && <img src={detail.qrDataUrl} alt="Ticket QR code" />}
      {detail.ticketCode && <code>{detail.ticketCode}</code>}
      <p>Order {orderId}</p>
      <p>
        <Link className="btn" href={state === "failed" ? "/tickets" : "/"}>
          {state === "failed" ? "BACK TO TICKETS" : "BACK HOME"}
        </Link>
      </p>
    </div>
  );
}
