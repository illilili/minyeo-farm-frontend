"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPatch } from "@/lib/api";

type Order = {
  id: number;
  orderNo: string;
  orderStatus: string;
  totalAmount: number;
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  async function refresh() {
    const data = await apiGet<Order[]>("/api/admin/orders");
    setOrders(data);
  }

  useEffect(() => {
    refresh().catch(() => setOrders([]));
  }, []);

  async function markPreparing(id: number) {
    await apiPatch(`/api/admin/orders/${id}/status`, { orderStatus: "PREPARING" });
    await refresh();
  }

  return (
    <section>
      <h2>관리자 주문 관리</h2>
      {orders.map((order) => (
        <article key={order.id} className="card">
          <strong>{order.orderNo}</strong>
          <p>{order.orderStatus}</p>
          <p>{order.totalAmount.toLocaleString()}원</p>
          <button onClick={() => markPreparing(order.id)}>PREPARING 변경</button>
        </article>
      ))}
    </section>
  );
}
