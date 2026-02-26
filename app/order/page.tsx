"use client";

import { FormEvent, useState } from "react";
import { apiPost } from "@/lib/api";

type OrderResponse = {
  id: number;
  orderNo: string;
  totalAmount: number;
};

export default function OrderPage() {
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [result, setResult] = useState<string>("");

  async function createOrder(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const created = await apiPost<OrderResponse>("/api/orders", {
      buyerName: "비회원고객",
      buyerPhone: "01012345678",
      buyerEmail: "guest@example.com",
      receiverName: "수령인",
      receiverPhone: "01012345678",
      receiverZipcode: "12345",
      receiverAddress1: "서울시 강남구",
      receiverAddress2: "101호",
      deliveryRequest: "문 앞에 놓아주세요.",
      items: [{ productId: 1, quantity: 1 }]
    });
    setOrder(created);
  }

  async function readyAndConfirm() {
    if (!order) return;
    await apiPost("/api/payments/toss/ready", { orderId: order.id });
    await apiPost("/api/payments/toss/confirm", {
      paymentKey: `pay_${order.orderNo}`,
      orderId: order.orderNo,
      amount: order.totalAmount
    });
    setResult("결제 승인 완료");
  }

  return (
    <section className="card">
      <h2>주문/결제</h2>
      <p>배송비 3,000원 / 50,000원 이상 무료</p>
      <p>수확상황에 따른 취소 가능</p>
      <form onSubmit={createOrder}>
        <button type="submit">테스트 주문 생성</button>
      </form>
      {order && (
        <div>
          <p>주문번호: {order.orderNo}</p>
          <p>결제금액: {order.totalAmount.toLocaleString()}원</p>
          <button onClick={readyAndConfirm}>결제 ready + confirm</button>
        </div>
      )}
      {result && <p>{result}</p>}
    </section>
  );
}
