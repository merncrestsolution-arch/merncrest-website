"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/routing";
import { formatMoney } from "@/lib/commerce-format";

type Order = {
  orderNumber: string;
  status: string;
  totalCents: number;
  currency: string;
  createdAt: string;
  items: { productName: string; quantity: number; totalCents: number }[];
  invoice: {
    invoiceNumber: string;
    status: string;
    dueAt: string | null;
    totalCents: number;
  } | null;
};

/** After client confirms checkout — show Order ID + invoice clearly */
export function OrderConfirmedView() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order") || "";
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/orders")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Failed");
        const list = (d.orders || []) as Order[];
        const found = orderNumber
          ? list.find((o) => o.orderNumber === orderNumber)
          : list[0];
        setOrder(found || null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, [orderNumber]);

  if (error) {
    return <p className="rlk-login-error">{error}</p>;
  }
  if (!order) {
    return <p className="rlk-empty">Loading order…</p>;
  }

  return (
    <>
      <h1 className="rlk-welcome">Order confirmed</h1>
      <p className="text-sm text-[#666] mb-4">
        Your order and invoice are ready. Complete payment to activate services.
      </p>

      <div className="rlk-stats mb-4">
        <div className="rlk-stat">
          <div className="rlk-stat-num text-base !text-[#17a2b8]">{order.orderNumber}</div>
          <div className="rlk-stat-label">Order ID</div>
        </div>
        <div className="rlk-stat">
          <div className="rlk-stat-num text-base">
            {order.invoice?.invoiceNumber || "—"}
          </div>
          <div className="rlk-stat-label">Invoice</div>
        </div>
        <div className="rlk-stat">
          <div className="rlk-stat-num text-base">{formatMoney(order.totalCents)}</div>
          <div className="rlk-stat-label">Total</div>
        </div>
        <div className="rlk-stat">
          <div className="rlk-stat-num text-base">{order.status}</div>
          <div className="rlk-stat-label">Status</div>
        </div>
      </div>

      <section className="rlk-section rlk-section-accent-teal">
        <div className="rlk-section-head">
          <h2>Line items</h2>
        </div>
        <div className="rlk-section-body">
          {order.items.map((i, idx) => (
            <div key={idx} className="rlk-row">
              <span>
                {i.productName} ×{i.quantity}
              </span>
              <span>{formatMoney(i.totalCents)}</span>
            </div>
          ))}
          {order.invoice?.dueAt && (
            <p className="text-sm text-[#666] mt-2">
              Invoice due {new Date(order.invoice.dueAt).toLocaleDateString()} ·{" "}
              {order.invoice.status}
            </p>
          )}
        </div>
      </section>

      <div className="flex flex-wrap gap-2 mt-4">
        <Link href="/portal/invoices" className="rlk-btn-green !w-auto !mt-0 !px-4 !inline-flex !items-center">
          Pay invoice
        </Link>
        <Link href="/portal/orders" className="rlk-btn-ghost !w-auto !mt-0 !px-4 !inline-flex !items-center">
          All orders
        </Link>
        <Link href="/portal/payments" className="rlk-btn-ghost !w-auto !mt-0 !px-4 !inline-flex !items-center">
          Payment history
        </Link>
      </div>
    </>
  );
}
