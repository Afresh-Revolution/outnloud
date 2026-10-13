import type { Metadata } from "next";
import { PaymentStatus } from "@/components/PaymentStatus";

export const metadata: Metadata = { title: "Ticket confirmed" };

export default async function ConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const orderId = typeof params.orderId === "string" ? params.orderId : "";
  const reference =
    (typeof params.reference === "string" && params.reference) ||
    (typeof params.trxref === "string" && params.trxref) ||
    "";
  const free = params.free === "1";

  return (
    <section className="section">
      <div className="wrap">
        <PaymentStatus orderId={orderId} reference={reference} free={free} />
      </div>
    </section>
  );
}
