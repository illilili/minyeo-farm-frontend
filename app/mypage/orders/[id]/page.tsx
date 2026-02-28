"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiGet } from "@/lib/api";

type Order = {
  id: number;
  orderNo: string;
  orderStatus: string;
  totalAmount: number;
};

export default function MyOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = params?.id;
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!orderId) return;
    apiGet<Order>(`/api/my/orders/${orderId}`).then(setOrder).catch(() => setOrder(null));
  }, [orderId]);

  if (!order) return <p>주문 정보를 불러오지 못했습니다.</p>;

  return (
    <section className="card">
      <h2>주문 상세</h2>
      <p>주문번호: {order.orderNo}</p>
      <p>상태: {order.orderStatus}</p>
      <p>결제금액: {order.totalAmount.toLocaleString()}원</p>
    </section>
  );
}

