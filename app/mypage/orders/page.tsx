"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";

type Order = {
  id: number;
  orderNo: string;
  orderStatus: string;
  totalAmount: number;
};

type OrderPage = { content: Order[] };

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<OrderPage>({ content: [] });
  useEffect(() => {
    apiGet<OrderPage>("/api/my/orders?page=0&size=20").then(setOrders).catch(() => setOrders({ content: [] }));
  }, []);

  return (
    <section>
      <h2>내 주문 목록</h2>
      {orders.content.map((order) => (
        <Link key={order.id} href={`/mypage/orders/${order.id}`} className="card">
          <strong>{order.orderNo}</strong>
          <p>{order.orderStatus}</p>
          <p>{order.totalAmount.toLocaleString()}원</p>
        </Link>
      ))}
    </section>
  );
}
