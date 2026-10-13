import type { Metadata } from "next";
import { CheckoutForm } from "@/components/CheckoutForm";
import { getFestivalEvent } from "@/lib/gatewav";

export const metadata: Metadata = { title: "Checkout" };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  let onSale = false;
  try {
    onSale = Boolean(await getFestivalEvent());
  } catch {
    onSale = false;
  }

  return (
    <section className="page-hero">
      <div className="wrap" style={{ maxWidth: 720 }}>
        <p className="kicker">Secure payment</p>
        <h1>Checkout</h1>
        <p className="lede">Name, email, and payment. Nothing else is required to get in.</p>
        <CheckoutForm onSale={onSale} />
      </div>
    </section>
  );
}
