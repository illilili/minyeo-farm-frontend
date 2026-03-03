"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function PaymentFailPage() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const message = searchParams.get("message");
  const orderId = searchParams.get("orderId");

  return (
    <section className="card stack">
      <h2>결제 실패</h2>
      <p>다시 시도하거나 고객센터로 문의해주세요.</p>
      {orderId && <p>주문번호: {orderId}</p>}
      {code && <p>오류코드: {code}</p>}
      {message && <p className="error">오류메시지: {message}</p>}

      <Link className="btn-primary" href="/order">
        주문/결제 페이지로 이동
      </Link>
    </section>
  );
}
